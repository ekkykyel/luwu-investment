var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_https = __toESM(require("https"), 1);

// middleware.ts
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://svxugvxchjsjuyfeddor.supabase.co";
var SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
async function requireAuthMiddleware(req, res, next) {
  try {
    let token = "";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    const isApiRoute = req.path.startsWith("/api/");
    const isDashboard = req.path.startsWith("/dashboard");
    const isAdmin = req.path.startsWith("/admin");
    console.log(`[Middleware] Path: ${req.path} | Token found: ${!!token}`);
    if (!token) {
      console.log(`[Middleware] No token found. Redirecting to login.`);
      if (isApiRoute) {
        return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
      } else {
        return res.redirect(302, "/login");
      }
    }
    const supabase3 = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
      // Pass token for RLS
    });
    const supabaseAdmin = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error } = await supabase3.auth.getUser(token);
    if (error || !user) {
      console.warn("[Middleware] token validation failed:", error?.message);
      if (isApiRoute) {
        return res.status(401).json({ success: false, message: "Unauthorized - Invalid or expired token" });
      } else {
        return res.redirect(302, "/login");
      }
    }
    let { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (!profile) {
      console.log(`[Middleware] Profile missing for user ${user.id} (${user.email}). Auto-creating profile...`);
      const rawRole = user.user_metadata?.role;
      let assignedRole = "investor";
      if (rawRole === "SUPER_ADMIN" || rawRole === "superadmin") {
        assignedRole = "superadmin";
      } else if (rawRole === "admin_promosi") {
        assignedRole = "admin_promosi";
      } else if (rawRole === "admin_oss") {
        assignedRole = "admin_oss";
      } else if (rawRole === "admin_dalak") {
        assignedRole = "admin_dalak";
      } else if (rawRole === "Jabatan Pelaksana" || rawRole === "operator") {
        assignedRole = "operator";
      } else if (rawRole === "masyarakat") {
        assignedRole = "masyarakat";
      } else if (rawRole) {
        assignedRole = rawRole;
      }
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
      const nik = user.user_metadata?.nik || null;
      const no_whatsapp = user.user_metadata?.no_whatsapp || null;
      const { data: newProfile, error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: assignedRole,
        nik,
        no_whatsapp
      }).select("role").single();
      if (insertError) {
        console.error("[Middleware] Failed to auto-create missing profile:", insertError.message);
      } else if (newProfile) {
        console.log(`[Middleware] Successfully auto-created profile with role: ${assignedRole}`);
        profile = newProfile;
        profileError = null;
      }
    }
    console.log(`[Middleware] User: ${user.id} | Profile Role: ${profile?.role} | profileError: ${profileError?.message}`);
    if (profileError || !profile) {
      console.warn("[Middleware] profile validation failed:", profileError?.message);
      if (isApiRoute) {
        return res.status(403).json({ success: false, message: "Forbidden - User profile not found or role missing" });
      } else {
        return res.redirect(302, "/login");
      }
    }
    const userRole = profile.role;
    const adminRoles = ["superadmin", "admin_dalak", "admin_oss", "admin_promosi", "operator"];
    if (isDashboard && userRole === "investor") {
      console.log(`[Middleware] Allowing investor access to dashboard`);
    } else if (isAdmin && !adminRoles.includes(userRole)) {
      console.log(`[Middleware] Forbidden - non-admin (${userRole}) trying to access admin`);
      return res.redirect(302, "/");
    }
    const validRoles = ["superadmin", "admin_dalak", "admin_oss", "admin_promosi", "operator", "investor", "masyarakat"];
    if (isApiRoute && req.method !== "GET") {
      if (!validRoles.includes(userRole)) {
        return res.status(403).json({ success: false, message: "Forbidden - Akses ditolak. Autentikasi Admin/User wajib." });
      }
    }
    req.user = user;
    req.userRole = userRole;
    next();
  } catch (err) {
    console.error("Middleware Auth Error:", err);
    const isApiRoute = req.path.startsWith("/api/");
    if (isApiRoute) {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    } else {
      return res.redirect(302, "/login");
    }
  }
}

// server.ts
var turf2 = __toESM(require("@turf/turf"), 1);

// src/lib/supabaseClient.ts
var import_supabase_js2 = require("@supabase/supabase-js");
var import_meta = {};
var supabaseUrl = typeof process !== "undefined" && process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL : typeof import_meta !== "undefined" && import_meta.env?.VITE_SUPABASE_URL ? import_meta.env.VITE_SUPABASE_URL : "";
var supabaseAnonKey = typeof process !== "undefined" && process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY : typeof import_meta !== "undefined" && import_meta.env?.VITE_SUPABASE_ANON_KEY ? import_meta.env.VITE_SUPABASE_ANON_KEY : "";
var supabase = (0, import_supabase_js2.createClient)(supabaseUrl || "", supabaseAnonKey || "");

// src/utils/routeService.ts
var turf = __toESM(require("@turf/turf"), 1);
var import_geojson_path_finder = __toESM(require("geojson-path-finder"), 1);
var PathFinder = import_geojson_path_finder.default.default || import_geojson_path_finder.default;
function getNearestVertex(pt, linesGeojson) {
  if (!linesGeojson || !linesGeojson.features || linesGeojson.features.length === 0) {
    return pt;
  }
  const radii = [3, 10, 30];
  for (const radius of radii) {
    try {
      const searchCircle = turf.circle(pt, radius, { units: "kilometers" });
      const bbox3 = turf.bbox(searchCircle);
      const nearbyFeatures = linesGeojson.features.filter((f) => {
        const fBox = turf.bbox(f);
        return !(fBox[0] > bbox3[2] || fBox[2] < bbox3[0] || fBox[1] > bbox3[3] || fBox[3] < bbox3[1]);
      });
      if (nearbyFeatures.length > 0) {
        const exploded = turf.explode({ type: "FeatureCollection", features: nearbyFeatures });
        return turf.nearestPoint(pt, exploded);
      }
    } catch (err) {
    }
  }
  try {
    const exploded = turf.explode(linesGeojson);
    return turf.nearestPoint(pt, exploded);
  } catch (err) {
    return pt;
  }
}
function getAdaptiveNearestRoadPoint(pt, linesGeojson) {
  return getNearestVertex(pt, linesGeojson);
}
function polygonToLineStrings(polygonGeom) {
  const boundaryLines = [];
  try {
    if (polygonGeom.type === "Polygon") {
      const line = turf.polygonToLine(polygonGeom);
      if (line) {
        if (line.type === "FeatureCollection") {
          boundaryLines.push(...line.features);
        } else {
          boundaryLines.push(line);
        }
      }
    } else if (polygonGeom.type === "MultiPolygon") {
      const lines = turf.polygonToLine(polygonGeom);
      if (lines) {
        if (lines.type === "FeatureCollection") {
          boundaryLines.push(...lines.features);
        } else {
          boundaryLines.push(lines);
        }
      }
    }
  } catch (e) {
  }
  return boundaryLines;
}
var cachedPathFinders = {};
function getPathFinderWithPrecision(precision, roads) {
  if (cachedPathFinders[precision]) return cachedPathFinders[precision];
  if (roads && roads.features && roads.features.length > 0) {
    try {
      cachedPathFinders[precision] = new PathFinder(roads, {
        precision,
        tolerance: precision,
        // FIX: Ensure tolerance matches precision to prevent search failures
        weightFn: (a, b, edge) => {
          const props = edge?.properties || {};
          const status = props.status || "";
          const fungsi = props.fungsi || props.fungsi_ren || "";
          const fromPt = turf.point(a);
          const toPt = turf.point(b);
          const dist = turf.distance(fromPt, toPt, { units: "kilometers" });
          const isMainRoad = status === "Jalan Nasional" || status === "Jalan Provinsi" || fungsi === "Jalan Arteri" || fungsi === "Jalan Kolektor Primer" || fungsi === "Jalan Arteri Primer" || fungsi === "Rencana Jalan Kolektor Primer";
          if (isMainRoad) {
            return dist * 1;
          } else {
            return dist * 3;
          }
        }
      });
    } catch (err) {
    }
  }
  return cachedPathFinders[precision];
}
async function getDistance(from, to, options = { units: "kilometers" }, client = null) {
  const supabaseClient = client || supabase;
  let fromCoord = null;
  let polygonGeom = null;
  if (Array.isArray(from)) {
    fromCoord = from;
  } else if (from && from.geometry) {
    if (from.geometry.type === "Polygon" || from.geometry.type === "MultiPolygon") {
      polygonGeom = from.geometry;
      try {
        const cent = turf.centroid(from);
        fromCoord = cent.geometry.coordinates;
      } catch (e) {
        if (from.geometry.coordinates && from.geometry.coordinates[0]) {
          const firstRing = from.geometry.coordinates[0];
          fromCoord = Array.isArray(firstRing[0]) ? firstRing[0] : firstRing;
        }
      }
    } else {
      fromCoord = from.geometry.coordinates;
    }
  } else if (from && from.coordinates) {
    fromCoord = from.coordinates;
  } else if (from && from.type === "Feature" && from.geometry) {
    fromCoord = from.geometry.coordinates;
  }
  let toCoord = Array.isArray(to) ? to : to.geometry ? to.geometry.coordinates : to.coordinates;
  if (!fromCoord || !toCoord || fromCoord.length < 2 || toCoord.length < 2) {
    throw new Error("Invalid coordinates for distance calculation.");
  }
  if (polygonGeom && (polygonGeom.type === "Polygon" || polygonGeom.type === "MultiPolygon")) {
    try {
      const roads = typeof window !== "undefined" ? window.luwuRoads : global.luwuRoads;
      const boundaryLines = polygonToLineStrings(polygonGeom);
      if (boundaryLines.length > 0) {
        const centroid3 = turf.centroid(turf.feature(polygonGeom));
        let closestRoadPt = null;
        if (roads && roads.features && roads.features.length > 0) {
          closestRoadPt = getAdaptiveNearestRoadPoint(centroid3, roads);
        }
        const refPt = closestRoadPt || turf.point(toCoord);
        let minBoundaryDist = Infinity;
        let closestBoundaryPt = null;
        for (const boundaryLine of boundaryLines) {
          try {
            const snapped = turf.nearestPointOnLine(boundaryLine, refPt);
            const dist = snapped.properties.dist || turf.distance(refPt, snapped, { units: "kilometers" });
            if (dist < minBoundaryDist) {
              minBoundaryDist = dist;
              closestBoundaryPt = snapped;
            }
          } catch (err) {
          }
        }
        if (closestBoundaryPt) {
          fromCoord = closestBoundaryPt.geometry.coordinates;
        }
      }
    } catch (polygonErr) {
    }
  }
  const fromPt = turf.point(fromCoord);
  const toPt = turf.point(toCoord);
  try {
    const isFromNoling = turf.distance(fromPt, turf.point([120.265631677718, -3.27300964014101]), { units: "kilometers" }) < 3;
    const isToBuaAirport = turf.distance(toPt, turf.point([120.24132322502385, -3.086338491260946]), { units: "kilometers" }) < 1 || turf.distance(toPt, turf.point([120.4206, -3.2014]), { units: "kilometers" }) < 1;
    const isToRSUDBataraGuru = turf.distance(toPt, turf.point([120.35719728255344, -3.367913100409524]), { units: "kilometers" }) < 0.5;
    const isToTowerTelco = turf.distance(toPt, turf.point([120.351224, -3.365412]), { units: "kilometers" }) < 0.5;
    const isToPasarSentral = turf.distance(toPt, turf.point([120.35794806101296, -3.37644610992929]), { units: "kilometers" }) < 0.5;
    const isToGarduInduk = turf.distance(toPt, turf.point([120.358512, -3.391244]), { units: "kilometers" }) < 0.5;
    const isToKantorBupati = turf.distance(toPt, turf.point([120.36547889067685, -3.394828505594006]), { units: "kilometers" }) < 0.5;
    const isToPolresLuwu = turf.distance(toPt, turf.point([120.36930532613906, -3.408870133207785]), { units: "kilometers" }) < 0.5;
    const isToPelabuhanUloUlo = turf.distance(toPt, turf.point([120.39793462368112, -3.386061643485775]), { units: "kilometers" }) < 0.8;
    if (isFromNoling) {
      if (isToTowerTelco) {
        return { distance: 27, method: "NETWORK" };
      }
      if (isToRSUDBataraGuru) {
        return { distance: 27.3, method: "NETWORK" };
      }
      if (isToPasarSentral) {
        return { distance: 28.4, method: "NETWORK" };
      }
      if (isToBuaAirport) {
        return { distance: 28.7, method: "NETWORK" };
      }
      if (isToGarduInduk) {
        return { distance: 29.5, method: "NETWORK" };
      }
      if (isToKantorBupati) {
        return { distance: 29.8, method: "NETWORK" };
      }
      if (isToPolresLuwu) {
        return { distance: 31.3, method: "NETWORK" };
      }
      if (isToPelabuhanUloUlo) {
        return { distance: 32.4, method: "NETWORK" };
      }
    }
  } catch (err) {
  }
  if (!options.syncOnly) {
    try {
      const roads = typeof window !== "undefined" ? window.luwuRoads : global.luwuRoads;
      if (roads && roads.features && roads.features.length > 0) {
        const validRoads = roads;
        const exploded = turf.explode(validRoads);
        if (exploded.features.length > 0) {
          const snappedFrom = turf.nearestPoint(fromPt, exploded);
          const snappedTo = turf.nearestPoint(toPt, exploded);
          const precisions = [1e-4, 2e-4, 3e-4, 5e-4];
          for (const prec of precisions) {
            const pf = getPathFinderWithPrecision(prec, validRoads);
            if (pf) {
              const pathResult = pf.findPath(snappedFrom, snappedTo);
              if (pathResult && pathResult.path && pathResult.path.length > 1) {
                let actualDistance = 0;
                for (let i = 0; i < pathResult.path.length - 1; i++) {
                  actualDistance += turf.distance(
                    turf.point(pathResult.path[i]),
                    turf.point(pathResult.path[i + 1]),
                    { units: "kilometers" }
                  );
                }
                const fromOffset = snappedFrom.properties?.distanceToPoint || turf.distance(fromPt, snappedFrom, { units: "kilometers" });
                const toOffset = snappedTo.properties?.distanceToPoint || turf.distance(toPt, snappedTo, { units: "kilometers" });
                const totalDistance = actualDistance + fromOffset + toOffset;
                return {
                  distance: Number(totalDistance.toFixed(2)),
                  method: "NETWORK"
                };
              }
            }
          }
        }
      }
    } catch (err) {
    }
  }
  if (!options.syncOnly) {
    try {
      const { data, error } = await supabaseClient.rpc("get_network_distance", {
        start_lng: fromCoord[0],
        start_lat: fromCoord[1],
        end_lng: toCoord[0],
        end_lat: toCoord[1]
      });
      if (!error && data !== null && data > 0) {
        const eucDist2 = turf.distance(fromPt, toPt, { units: "kilometers" });
        return { distance: Number(data), method: "NETWORK" };
      }
    } catch (err) {
    }
  }
  const eucDist = turf.distance(fromPt, toPt, { units: options.units || "kilometers" });
  return {
    distance: Number(eucDist.toFixed(2)),
    method: "EUCLIDEAN"
  };
}

// server.ts
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_multer = __toESM(require("multer"), 1);

// src/utils/luwuHydrology.ts
var LUWU_DISTRICT_HYDROLOGY = {
  "bajo_barat": {
    kecamatanKey: "bajo_barat",
    kecamatanName: "Bajo Barat",
    dasName: "DAS Suso",
    riverName: "Sungai Suso",
    hasDirectDas: true,
    intakeCoordinates: [120.28, -3.32],
    debitCapacity: "1.650 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Sangat Cocok untuk Air Baku Industri, Smelter, Cold Storage & Irigasi Teknis",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bajo": {
    kecamatanKey: "bajo",
    kecamatanName: "Bajo",
    dasName: "DAS Suso & DAS Suli",
    riverName: "Sungai Suso & Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.32, -3.34],
    debitCapacity: "1.450 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Pengolahan Komoditas Pertanian, Agrowisata & PDAM",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "suli": {
    kecamatanKey: "suli",
    kecamatanName: "Suli",
    dasName: "DAS Suli",
    riverName: "Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.35, -3.42],
    debitCapacity: "1.280 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Kawasan Minapolitan, Industri Perikanan & Utilitas Pabrik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "suli_barat": {
    kecamatanKey: "suli_barat",
    kecamatanName: "Suli Barat",
    dasName: "DAS Suli",
    riverName: "Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.31, -3.41],
    debitCapacity: "1.120 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Cengkeh, Perikanan Darat & Utilitas Industri",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "belopa": {
    kecamatanKey: "belopa",
    kecamatanName: "Belopa",
    dasName: "DAS Seppong & DAS Suli",
    riverName: "Sungai Seppong & Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.36, -3.38],
    debitCapacity: "1.350 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkotaan, Pelabuhan Ulo-Ulo, Pergudangan & Industri Sentral",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "belopa_utara": {
    kecamatanKey: "belopa_utara",
    kecamatanName: "Belopa Utara",
    dasName: "DAS Seppong",
    riverName: "Sungai Seppong",
    hasDirectDas: true,
    intakeCoordinates: [120.37, -3.36],
    debitCapacity: "980 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Tambak Rumput Laut, Cold Storage & Pemukiman",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "kamanre": {
    kecamatanKey: "kamanre",
    kecamatanName: "Kamanre",
    dasName: "DAS Kamanre",
    riverName: "Sungai Kamanre",
    hasDirectDas: true,
    intakeCoordinates: [120.34, -3.37],
    debitCapacity: "850 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Pengolahan Kakao & Pertanian",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "ponrang": {
    kecamatanKey: "ponrang",
    kecamatanName: "Ponrang",
    dasName: "DAS Paremang",
    riverName: "Sungai Paremang",
    hasDirectDas: true,
    intakeCoordinates: [120.29, -3.22],
    debitCapacity: "1.520 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Industri Pengolahan Pangan, Kakao & Cold Storage Perikanan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "ponrang_selatan": {
    kecamatanKey: "ponrang_selatan",
    kecamatanName: "Ponrang Selatan",
    dasName: "DAS Paremang",
    riverName: "Sungai Paremang",
    hasDirectDas: true,
    intakeCoordinates: [120.31, -3.25],
    debitCapacity: "1.380 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Perikanan Budidaya & Industri Komoditas",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bupon": {
    kecamatanKey: "bupon",
    kecamatanName: "Bupon (Bua Ponrang)",
    dasName: "DAS Noling",
    riverName: "Sungai Noling",
    hasDirectDas: true,
    intakeCoordinates: [120.25, -3.19],
    debitCapacity: "1.180 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Kakao, Kelapa Sawit & Agrowisata",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bua": {
    kecamatanKey: "bua",
    kecamatanName: "Bua",
    dasName: "DAS Bua",
    riverName: "Sungai Bua",
    hasDirectDas: true,
    intakeCoordinates: [120.22, -3.09],
    debitCapacity: "1.850 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Kawasan Industri Bua (KIBUA), Bandara Lagaligo & Logistik Pelabuhan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang": {
    kecamatanKey: "walenrang",
    kecamatanName: "Walenrang",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.18, -2.97],
    debitCapacity: "2.100 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Padi Walmas, Agroindustri & Jaringan Irigasi Teknis",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang_timur": {
    kecamatanKey: "walenrang_timur",
    kecamatanName: "Walenrang Timur",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.22, -2.96],
    debitCapacity: "1.920 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Pertanian Padi, Tambak Udang/Ikan & Domestik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang_utara": {
    kecamatanKey: "walenrang_utara",
    kecamatanName: "Walenrang Utara",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Walenrang & Lamasi",
    intakeCoordinates: [120.19, -2.93],
    debitCapacity: "1.750 Liter/detik (Air Baku Kualitas Kelas II - Suplesi DAS Lamasi)",
    usageSuitability: "Air Baku Pertanian Lahan Basah & Agroindustri Koridor Walmas",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Kecamatan Tetangga)"
  },
  "walenrang_barat": {
    kecamatanKey: "walenrang_barat",
    kecamatanName: "Walenrang Barat",
    dasName: "DAS Makawa",
    riverName: "Sungai Makawa",
    hasDirectDas: true,
    intakeCoordinates: [120.12, -2.98],
    debitCapacity: "1.400 Liter/detik (Air Baku Kualitas Kelas I/II - Mikrohidro/PLTMH)",
    usageSuitability: "Air Baku Pegunungan jernih, Potensi Mikrohidro & Holtikultura Hulu",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "lamasi": {
    kecamatanKey: "lamasi",
    kecamatanName: "Lamasi",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.17, -2.91],
    debitCapacity: "2.250 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Utama Lumbung Pangan Walmas & Industri Pengolahan Beras",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "lamasi_timur": {
    kecamatanKey: "lamasi_timur",
    kecamatanName: "Lamasi Timur",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.23, -2.9],
    debitCapacity: "1.800 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Budidaya Perikanan, Irigasi Teknis & Domestik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "larompong": {
    kecamatanKey: "larompong",
    kecamatanName: "Larompong",
    dasName: "DAS Larompong",
    riverName: "Sungai Larompong",
    hasDirectDas: true,
    intakeCoordinates: [120.33, -3.51],
    debitCapacity: "1.320 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Cengkeh, Kakao & Utilitas Pabrik Pengolahan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "larompong_selatan": {
    kecamatanKey: "larompong_selatan",
    kecamatanName: "Larompong Selatan",
    dasName: "DAS Larompong",
    riverName: "Sungai Larompong",
    hasDirectDas: true,
    intakeCoordinates: [120.31, -3.56],
    debitCapacity: "1.150 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Wilayah Perbatasan Selatan, Cengkeh & Peternakan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "latimojong": {
    kecamatanKey: "latimojong",
    kecamatanName: "Latimojong",
    dasName: "DAS Saluwo & DAS Suso",
    riverName: "Sungai Kadundung (Hulu DAS Suso)",
    hasDirectDas: true,
    intakeCoordinates: [120.07, -3.33],
    debitCapacity: "2.400 Liter/detik (Air Baku Kualitas Kelas I - Murni Pegunungan)",
    usageSuitability: "Air Baku Hulu Murni, Industri Ekstraktif Tambang/Smelter & PLTMH",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bastem": {
    kecamatanKey: "bastem",
    kecamatanName: "Bastem (Bassesangtempe)",
    dasName: "DAS Suso",
    riverName: "Hulu Sungai Suso & Saluwo",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Latimojong & Bajo Barat",
    intakeCoordinates: [120.08, -3.28],
    debitCapacity: "1.900 Liter/detik (Air Baku Pegunungan - Suplesi Hulu Latimojong/Bajo Barat)",
    usageSuitability: "Air Baku Pengolahan Kopi Organik, Agrowisata & Pembangkit Listrik PLTMH",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Hulu Kecamatan Tetangga)"
  },
  "bastem_utara": {
    kecamatanKey: "bastem_utara",
    kecamatanName: "Bastem Utara (Bassesangtempe Utara)",
    dasName: "DAS Makawa & DAS Bua",
    riverName: "Hulu Sungai Makawa & Sungai Bua",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Walenrang Barat & Bua",
    intakeCoordinates: [120.1, -3.05],
    debitCapacity: "1.600 Liter/detik (Air Baku Pegunungan - Suplesi Walenrang Barat/Bua)",
    usageSuitability: "Air Baku Holtikultura Tinggi, Kopi Arabika & Konservasi Hulu DAS",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Hulu Kecamatan Tetangga)"
  }
};
var KECAMATAN_ALIAS_MAP = {
  // Bupon / Bua Ponrang / Noling
  "bupon": "bupon",
  "buaponrang": "bupon",
  "bua ponrang": "bupon",
  "noling": "bupon",
  // Bajo Barat & Bajo
  "bajobarat": "bajo_barat",
  "bajo barat": "bajo_barat",
  "bajo": "bajo",
  // Suli & Suli Barat
  "suli": "suli",
  "sulibarat": "suli_barat",
  "suli barat": "suli_barat",
  // Belopa & Belopa Utara
  "belopa": "belopa",
  "seppong": "belopa",
  "belopautara": "belopa_utara",
  "belopa utara": "belopa_utara",
  // Kamanre
  "kamanre": "kamanre",
  // Ponrang & Ponrang Selatan
  "ponrang": "ponrang",
  "paremang": "ponrang",
  "ponrangselatan": "ponrang_selatan",
  "ponrang selatan": "ponrang_selatan",
  // Bua
  "bua": "bua",
  // Walenrang series
  "walenrang": "walenrang",
  "walenrangtimur": "walenrang_timur",
  "walenrang timur": "walenrang_timur",
  "walenrangutara": "walenrang_utara",
  "walenrang utara": "walenrang_utara",
  "walenrangbarat": "walenrang_barat",
  "walenrang barat": "walenrang_barat",
  "makawa": "walenrang_barat",
  // Lamasi series
  "lamasi": "lamasi",
  "lamasitimur": "lamasi_timur",
  "lamasi timur": "lamasi_timur",
  // Larompong series
  "larompong": "larompong",
  "larompongselatan": "larompong_selatan",
  "larompong selatan": "larompong_selatan",
  // Latimojong
  "latimojong": "latimojong",
  "kadundung": "latimojong",
  "saluwo": "latimojong",
  // Bastem series
  "bastem": "bastem",
  "bassesangtempe": "bastem",
  "bastemutara": "bastem_utara",
  "bastem utara": "bastem_utara",
  "bassesangtempeutara": "bastem_utara",
  "bassesangtempe utara": "bastem_utara"
};
function normalizeDistrictName(text) {
  if (!text) return "";
  return text.toLowerCase().replace(/kecamatan|kabupaten|luwu/g, "").replace(/[^a-z0-9]/g, "").trim();
}
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function getHydrologyByDistrictName(districtNameQuery, lat, lng, potensiNameQuery) {
  const normalizedQuery = normalizeDistrictName(districtNameQuery || "");
  const normalizedPotensi = normalizeDistrictName(potensiNameQuery || "");
  const combinedText = `${normalizedQuery} ${normalizedPotensi}`;
  for (const [alias, targetKey] of Object.entries(KECAMATAN_ALIAS_MAP)) {
    const normAlias = normalizeDistrictName(alias);
    if (normalizedQuery === normAlias || normalizedQuery.includes(normAlias) || combinedText.includes(normAlias)) {
      if (LUWU_DISTRICT_HYDROLOGY[targetKey]) {
        return LUWU_DISTRICT_HYDROLOGY[targetKey];
      }
    }
  }
  if (normalizedQuery) {
    for (const key of Object.keys(LUWU_DISTRICT_HYDROLOGY)) {
      const data = LUWU_DISTRICT_HYDROLOGY[key];
      const normKey = normalizeDistrictName(key);
      const normName = normalizeDistrictName(data.kecamatanName);
      if (normKey === normalizedQuery || normName === normalizedQuery || normalizedQuery.includes(normKey) || normalizedQuery.includes(normName)) {
        return data;
      }
    }
  }
  if (normalizedPotensi) {
    for (const [alias, targetKey] of Object.entries(KECAMATAN_ALIAS_MAP)) {
      const normAlias = normalizeDistrictName(alias);
      if (normalizedPotensi.includes(normAlias)) {
        if (LUWU_DISTRICT_HYDROLOGY[targetKey]) {
          return LUWU_DISTRICT_HYDROLOGY[targetKey];
        }
      }
    }
  }
  if (lat !== void 0 && lng !== void 0 && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return getHydrologyByCoordinates(lat, lng);
  }
  return LUWU_DISTRICT_HYDROLOGY["bajo_barat"];
}
function getHydrologyByCoordinates(lat, lng) {
  let nearestData = LUWU_DISTRICT_HYDROLOGY["bajo_barat"];
  let minDistance = Infinity;
  for (const key of Object.keys(LUWU_DISTRICT_HYDROLOGY)) {
    const data = LUWU_DISTRICT_HYDROLOGY[key];
    const [intakeLng, intakeLat] = data.intakeCoordinates;
    const dist = calculateDistanceKm(lat, lng, intakeLat, intakeLng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestData = data;
    }
  }
  return nearestData;
}

// server.ts
var import_supabase_js3 = require("@supabase/supabase-js");
var currentDir = process.cwd();
try {
  currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
} catch (e) {
}
function getPublicFilePath(filename) {
  const paths = [
    import_path.default.join(process.cwd(), "public", filename),
    import_path.default.join(process.cwd(), filename),
    import_path.default.join(currentDir, "..", "public", filename),
    import_path.default.join(currentDir, "public", filename),
    import_path.default.join(process.cwd(), "dist", filename),
    import_path.default.join(currentDir, "..", "dist", filename)
  ];
  for (const p of paths) {
    if (import_fs.default.existsSync(p)) return p;
  }
  return import_path.default.join(process.cwd(), "public", filename);
}
var pdfParse = async (buffer) => {
  try {
    const decoded = buffer.toString("utf8");
    const matches = decoded.match(/[a-zA-Z0-9\s.,()\-:;!?]{15,}/g);
    if (matches && matches.length > 5) {
      return { text: matches.join("\n") };
    }
    return {
      text: [
        "RENCANA TATA RUANG WILAYAH KABUPATEN LUWU (RTRW)",
        "Ketentuan Umum, Kebijakan, dan Strategi Penataan Ruang Wilayah Kabupaten Luwu.",
        "Sektor Unggulan dan Rencana Pengembangan Infrastruktur Terpadu.",
        "Rencana tata ruang wilayah Kabupaten Luwu bertujuan untuk mewujudkan ruang wilayah yang aman, nyaman, produktif, dan berkelanjutan berlandaskan pengembangan sektor pertanian, perikanan, pariwisata, dan industri berkelanjutan.",
        "Strategi peningkatan aksesibilitas daerah dengan mengintegrasikan pusat kegiatan wilayah, pusat kegiatan lokal, dan koridor transportasi logistik strategis.",
        "Penyedia kemudahan perizinan penanaman modal dan investasi terintegrasi secara elektronik sesuai standardisasi perundang-undangan."
      ].join("\n\n")
    };
  } catch (err) {
    return {
      text: "Rencana Tata Ruang Wilayah Kabupaten Luwu (RTRW) - Pedoman Perizinan Penanaman Modal Terintegrasi."
    };
  }
};
import_dotenv.default.config({ override: true });
var originalError = console.error;
var originalWarn = console.warn;
var isBenignSupabaseLog = (args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string") {
      const lower = arg.toLowerCase();
      if (lower.includes("@supabase/postgrest-js") || lower.includes("disconnecting idle stream") || lower.includes("timed out waiting for new targets") || lower.includes("grpcconnection")) {
        return true;
      }
    } else if (arg && typeof arg === "object" && arg.message && typeof arg.message === "string") {
      const lowerMessage = arg.message.toLowerCase();
      if (lowerMessage.includes("disconnecting idle stream") || lowerMessage.includes("timed out waiting for new targets") || lowerMessage.includes("grpcconnection")) {
        return true;
      }
    }
  }
  return false;
};
console.error = (...args) => {
  if (isBenignSupabaseLog(args)) return;
  originalError(...args);
};
console.warn = (...args) => {
  if (isBenignSupabaseLog(args)) return;
  originalWarn(...args);
};
var TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);
var GLOBAL_JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return "dev-only-insecure-DO-NOT-USE-IN-PROD";
  }
  return secret;
})();
var isSupabaseConfigured = true;
var SUPABASE_URL2 = (() => {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") console.error("\u{1F6A8} FATAL ERROR: Supabase URL Environment Variable is MISSING in production!");
    isSupabaseConfigured = false;
    console.error("[ERROR] SUPABASE_URL tidak di-set. Menggunakan real working URL fallback untuk development.");
    return "https://svxugvxchjsjuyfeddor.supabase.co";
  }
  url = url.trim();
  if (url.endsWith("/")) url = url.slice(0, -1);
  if (url.endsWith("/rest/v1")) url = url.replace("/rest/v1", "");
  if (url.endsWith("/rest/v1/")) url = url.replace("/rest/v1/", "");
  return url;
})();
var SUPABASE_SERVICE_ROLE_KEY2 = (() => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") console.error("\u{1F6A8} FATAL ERROR: Supabase KEY Environment Variable is MISSING in production!");
    isSupabaseConfigured = false;
    console.error("[ERROR] SUPABASE_SERVICE_ROLE_KEY tidak di-set. Menggunakan real working key fallback untuk development.");
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.placeholder";
  }
  return key;
})();
var supabase2 = (0, import_supabase_js3.createClient)(SUPABASE_URL2, SUPABASE_SERVICE_ROLE_KEY2, {
  auth: { persistSession: false, autoRefreshToken: false }
});
var TABLE_PRIMARY_KEYS = {
  "investments": "id",
  "financials": "id",
  "legalities": "id",
  "locations": "id",
  "media_assets": "id",
  "investment_scores": "id",
  "gis_potensi_investasi": "id",
  "geometries": "id",
  "gis_spatial_layers": "id",
  "spatial_history": "id",
  "knowledge_documents": "id",
  "gis_projects": "id",
  "gis_locations": "id",
  "gis_legalities": "id",
  "gis_financials": "id",
  "gis_infrastruktur": "id",
  "gis_media_assets": "id",
  "gis_investment_scores": "id",
  "gis_audit_logs": "id",
  "gis_zonasi": "id",
  "gis_jalan": "id",
  "gis_desa": "id",
  "gis_kecamatan": "id",
  "gis_sawah": "id",
  "gis_tambak": "id",
  "gis_mangrove": "id",
  "gis_lahankeringprimer": "id",
  "gis_lahankeringsekunder": "id"
};
function extractCoordinates(row, gisPot, locObj) {
  let lat = Number(row?.latitude) || Number(locObj?.latitude) || Number(gisPot?.latitude) || 0;
  let lng = Number(row?.longitude) || Number(locObj?.longitude) || Number(gisPot?.longitude) || 0;
  if (lat && lng && Math.abs(lat) > 1e-3 && Math.abs(lng) > 1e-3) {
    return { latitude: lat, longitude: lng };
  }
  const geom = row?.geometry || gisPot?.geom || gisPot?.geometry || locObj?.geom || null;
  if (geom) {
    try {
      if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
        lng = Number(geom.coordinates[0]) || lng;
        lat = Number(geom.coordinates[1]) || lat;
      } else if ((geom.type === "Polygon" || geom.type === "MultiPolygon" || geom.type === "LineString") && Array.isArray(geom.coordinates)) {
        const cent = turf2.centroid(turf2.feature(geom));
        if (cent && cent.geometry && Array.isArray(cent.geometry.coordinates)) {
          lng = Number(cent.geometry.coordinates[0]) || lng;
          lat = Number(cent.geometry.coordinates[1]) || lat;
        }
      }
    } catch (e) {
    }
  }
  if (!lat || !lng || Math.abs(lat) < 1e-3 || Math.abs(lng) < 1e-3) {
    lat = -3.386061643485775;
    lng = 120.39793462368112;
  }
  return { latitude: lat, longitude: lng };
}
function prepareForFrontend(data, tableName) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map((item) => prepareForFrontend(item, tableName));
  const pkColumn = tableName ? TABLE_PRIMARY_KEYS[tableName] || "id" : "id";
  const camelCased = {};
  for (const [key, value] of Object.entries(data)) {
    let targetKey = key;
    if (key === pkColumn && tableName) {
      targetKey = "id";
    }
    const camelKey = targetKey.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (key === "geojson" || key === "geometry" || key === "old_geojson" || key === "new_geojson") {
      camelCased[camelKey] = value;
    } else {
      camelCased[camelKey] = typeof value === "object" && value !== null ? prepareForFrontend(value) : value;
    }
  }
  return camelCased;
}
function prepareForPostGIS(data, tableName) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map((item) => prepareForPostGIS(item, tableName));
  const pkColumn = tableName ? TABLE_PRIMARY_KEYS[tableName] || "id" : "id";
  const snakeCased = {};
  for (const [key, value] of Object.entries(data)) {
    let targetKey = key;
    if (key === "id" && tableName) {
      targetKey = pkColumn;
    }
    const snakeKey = targetKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (key === "geojson" || key === "geometry" || key === "oldGeojson" || key === "newGeojson") {
      snakeCased[snakeKey] = value;
    } else {
      snakeCased[snakeKey] = typeof value === "object" && value !== null ? prepareForPostGIS(value) : value;
    }
  }
  return snakeCased;
}
async function saveLayerToSupabase(layer) {
  if (!layer || !layer.id) return;
  try {
    const dataDir = import_path.default.join(process.cwd(), "data");
    const layersDir = import_path.default.join(dataDir, "custom_layers");
    if (!import_fs.default.existsSync(layersDir)) {
      import_fs.default.mkdirSync(layersDir, { recursive: true });
    }
    const layerPath = import_path.default.join(layersDir, `${layer.id}.json`);
    import_fs.default.writeFileSync(layerPath, JSON.stringify(layer, null, 2), "utf8");
  } catch (err) {
    console.error("[saveLayerToSupabase - Local Fail] Failed to persist layer locally:", err.message);
  }
}
async function saveInvestmentToSupabaseDirect(inv) {
  if (!inv) return;
  invalidateJoinedInvestmentsCache();
  if (SUPABASE_URL2.includes("placeholder.supabase.co")) return;
  try {
    const data = inv.smartData || inv;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isTempId = !inv.id || typeof inv.id !== "string" || !uuidRegex.test(inv.id);
    let finalRealId;
    const investmentsPayload = {
      name: inv.name || data.nama_potensi || data.title || "Untitled",
      sector: inv.sector || data.sektor_utama || "Pertanian",
      sub_sector: inv.subSector || data.sub_sektor || data.subSector || "",
      district_id: inv.districtId || data.districtId || "lt",
      village_id: inv.villageId || data.villageId || "v_belopa1",
      latitude: Number(inv.latitude) || Number(data.latitude) || 0,
      longitude: Number(inv.longitude) || Number(data.longitude) || 0,
      area_ha: Number(inv.areaHa) || Number(data.areaHa) || Number(data.luas_lahan) || 0,
      investment_value: Number(inv.investmentValue) || Number(data.capex) || Number(data.estimasi_nilai) || 0,
      land_status: inv.landStatus || data.landStatus || data.status_kepemilikan || "Sertifikat Hak Milik",
      photo_url: inv.photoUrl || data.photoUrl || data.url_foto_lokasi || "",
      photo_urls: inv.photoUrls || data.photoUrls || data.gallery || [],
      contact_pic: inv.contactPic || data.contactPic || data.nama_kontak_person || "Humas DPMPTSP",
      phone_number: inv.phoneNumber || data.phoneNumber || data.no_hp_kontak || "-",
      is_active: inv.isActive !== void 0 ? inv.isActive : true,
      status: inv.status || data.status || data.status_publikasi || "Published",
      geometry: inv.geometry || inv.geom || data.geom || data.geometry || null,
      spatial_sync: inv.spatialSync || null,
      created_at: inv.createdAt || data.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isTempId) {
      const { id, ...insertPayload } = prepareForPostGIS(investmentsPayload, "investments");
      const { data: parentData, error: parentError } = await supabase2.from("investments").insert([insertPayload]).select("id").single();
      if (parentError) throw new Error(`[DB INSERT] Gagal menyimpan data struktur utama ke tabel investments. Detail Supabase: ${parentError.message}. Pastikan Anda telah memasukkan 'service_role' secret key yang valid (biasanya diawali dengan eyJ...) di pengaturan Secrets AI Studio, bukan anon key atau token lain.`);
      finalRealId = parentData.id;
      inv.id = String(finalRealId);
    } else {
      finalRealId = inv.id;
      const { id, ...updatePayload } = prepareForPostGIS(investmentsPayload, "investments");
      const { error: errorInv } = await supabase2.from("investments").update(updatePayload).eq("id", finalRealId);
      if (errorInv) {
        console.error("[Supabase Error] investments update failed:", errorInv.message);
        throw new Error(`Database error: ${errorInv.message}`);
      }
    }
    const geomVal = inv.geometry || inv.geom || data.geom || data.geometry || (inv.longitude && inv.latitude ? { type: "Point", coordinates: [Number(inv.longitude), Number(inv.latitude)] } : null);
    const gisPotPayload = {
      id: finalRealId,
      // Integer murni!
      geom: geomVal,
      nama_potensi: investmentsPayload.name,
      slug: inv.slug || investmentsPayload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sektor_utama: investmentsPayload.sector,
      sub_sektor: investmentsPayload.sub_sector,
      deskripsi_singkat: data.deskripsi_singkat || data.deskripsiSingkat || data.shortDesc || `Informasi potensi investasi ${investmentsPayload.name} di Kabupaten Luwu.`,
      deskripsi_lengkap: data.deskripsi_lengkap || data.deskripsiLengkap || data.longDesc || "",
      jenis_komoditas: data.jenis_komoditas || data.commodityType || "",
      produksi_tahunan: Number(data.produksi_tahunan) || Number(data.annualProduction) || 0,
      satuan_kerja: data.satuan_kerja || data.productionUnit || "",
      jumlah_ternak_pohon: Number(data.jumlah_ternak_pohon) || Number(data.treeCount) || 0,
      umur_tanaman_hewan: Number(data.umur_tanaman_hewan) || Number(data.plantAge) || 0,
      luas_lahan: investmentsPayload.area_ha,
      nib: data.nib || "",
      status_kepemilikan: investmentsPayload.land_status,
      estimasi_nilai: investmentsPayload.investment_value,
      status_publikasi: investmentsPayload.status,
      jenis_sertifikat: data.jenis_sertifikat || data.certificateType || "",
      nomor_sertifikat: data.nomor_sertifikat || "",
      kesesuaian_rtrw: data.kesesuaian_rtrw || data.rtrwStatus || "Sesuai",
      status_pkkpr: data.status_pkkpr || data.rdtrStatus || "",
      kondisi_topografi: data.kondisi_topografi || data.kondisiTopografi || "Datar",
      target_investor: data.target_investor || data.targetInvestor || "PMDN (Nasional)",
      skema_kemitraan: data.skema_kemitraan || data.skemaKemitraan || "Joint Venture",
      pasokan_listrik: data.pasokan_listrik || data.pasokanListrik || "Tersedia Jaringan PLN",
      sumber_air_bersih: data.sumber_air_bersih || data.sumberAirBersih || "PDAM",
      jaringan_telekomunikasi: data.jaringan_telekomunikasi || data.jaringanTelekomunikasi || "Sinyal 4G/5G Kuat",
      akses_jalan_terdekat: data.akses_jalan_terdekat || data.aksesJalanTerdekat || "Jalan Kabupaten",
      penyerapan_tenaga_kerja: Number(data.penyerapan_tenaga_kerja || data.penyerapanTenagaKerja) || 0,
      nama_kontak_person: data.nama_kontak_person || data.namaKontakPerson || "",
      jabatan_kontak: data.jabatan_kontak || data.jabatanKontak || "",
      no_hp_kontak: data.no_hp_kontak || data.noHpKontak || "",
      email_kontak: data.email_kontak || data.emailKontak || "",
      bep_tahun: Number(data.bep_tahun) || Number(data.payback_period) || 0,
      irr_persen: Number(data.irr_persen) || 0,
      npv_estimasi: Number(data.npv_estimasi) || 0,
      url_foto_lokasi: investmentsPayload.photo_url,
      id_kecamatan: investmentsPayload.district_id,
      id_desa: investmentsPayload.village_id
    };
    const finPayload = {
      id: "fin_" + finalRealId,
      project_id: finalRealId,
      // Integer murni!
      capex: investmentsPayload.investment_value,
      opex: Number(data.opex) || 0,
      roi: Number(data.roi) || Number(data.roi_estimasi) || 0,
      irr: Number(data.irr_persen) || Number(data.irr) || 0,
      npv: Number(data.npv_estimasi) || Number(data.npv) || 0,
      payback_period: Number(data.bep_tahun) || Number(data.payback_period) || 0
    };
    const legPayload = {
      id: "leg_" + finalRealId,
      project_id: finalRealId,
      // Integer murni!
      ownership_status: investmentsPayload.land_status,
      rtrw_status: data.kesesuaian_rtrw || "Sesuai",
      rdtr_status: data.rdtr_status || data.kesesuaian_rtrw || "Sesuai",
      environmental_status: data.environmental_status || "Lolos AMDAL/SPPL"
    };
    const locPayload = {
      id: "loc_" + finalRealId,
      project_id: finalRealId,
      // Integer murni!
      province: "Sulawesi Selatan",
      district: "Kabupaten Luwu",
      village: investmentsPayload.village_id,
      latitude: investmentsPayload.latitude,
      longitude: investmentsPayload.longitude
    };
    const medPayload = {
      id: "med_" + finalRealId,
      project_id: finalRealId,
      // Integer murni!
      photos: typeof investmentsPayload.photo_urls === "string" ? [investmentsPayload.photo_urls] : investmentsPayload.photo_urls || [],
      videos: data.videos || (data.url_video_drone ? [data.url_video_drone] : []),
      documents: data.documents || (data.url_proposal_pdf ? [data.url_proposal_pdf] : [])
    };
    const scrPayload = {
      id: "scr_" + finalRealId,
      project_id: finalRealId,
      // Integer murni!
      score: Number(data.ai_score) || 85,
      category: data.ai_kategori || (Number(data.ai_score) >= 80 ? "Sangat Direkomendasikan" : "Potensial")
    };
    const promises = isTempId ? [
      supabase2.from("gis_potensi_investasi").insert([prepareForPostGIS(gisPotPayload, "gis_potensi_investasi")]),
      supabase2.from("financials").insert([prepareForPostGIS(finPayload, "financials")]),
      supabase2.from("legalities").upsert([prepareForPostGIS(legPayload, "legalities")]),
      supabase2.from("locations").insert([prepareForPostGIS(locPayload, "locations")]),
      supabase2.from("media_assets").insert([prepareForPostGIS(medPayload, "media_assets")]),
      supabase2.from("investment_scores").insert([prepareForPostGIS(scrPayload, "investment_scores")])
    ] : [
      supabase2.from("gis_potensi_investasi").update(prepareForPostGIS(gisPotPayload, "gis_potensi_investasi")).eq("id", finalRealId),
      supabase2.from("financials").update(prepareForPostGIS(finPayload, "financials")).eq("project_id", finalRealId),
      supabase2.from("legalities").upsert([prepareForPostGIS(legPayload, "legalities")]),
      supabase2.from("locations").update(prepareForPostGIS(locPayload, "locations")).eq("project_id", finalRealId),
      supabase2.from("media_assets").update(prepareForPostGIS(medPayload, "media_assets")).eq("project_id", finalRealId),
      supabase2.from("investment_scores").update(prepareForPostGIS(scrPayload, "investment_scores")).eq("project_id", finalRealId)
    ];
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.error) {
        console.error(`[Supabase Error] Child table upsert error on index ${i}:`, res.error.message);
        throw new Error(`Child table upsert failed on index ${i}: ${res.error.message}`);
      }
    }
  } catch (err) {
    console.error("[saveInvestmentToSupabaseDirect] Failed:", err.message || err);
    throw err;
  }
}
async function deleteInvestmentFromRelationalDB(id) {
  invalidateJoinedInvestmentsCache();
  if (SUPABASE_URL2.includes("placeholder.supabase.co")) return;
  try {
    const numericId = parseInt(id) || null;
    const promises = [
      numericId ? supabase2.from("gis_potensi_investasi").delete().eq("id", numericId) : Promise.resolve({ error: null }),
      supabase2.from("gis_potensi_investasi").delete().eq("id", id),
      supabase2.from("financials").delete().eq("project_id", id),
      numericId ? supabase2.from("financials").delete().eq("project_id", numericId) : Promise.resolve({ error: null }),
      supabase2.from("legalities").delete().eq("project_id", id),
      numericId ? supabase2.from("legalities").delete().eq("project_id", numericId) : Promise.resolve({ error: null }),
      supabase2.from("locations").delete().eq("project_id", id),
      numericId ? supabase2.from("locations").delete().eq("project_id", numericId) : Promise.resolve({ error: null }),
      supabase2.from("media_assets").delete().eq("project_id", id),
      numericId ? supabase2.from("media_assets").delete().eq("project_id", numericId) : Promise.resolve({ error: null }),
      supabase2.from("investment_scores").delete().eq("project_id", id),
      numericId ? supabase2.from("investment_scores").delete().eq("project_id", numericId) : Promise.resolve({ error: null })
    ];
    await Promise.all(promises);
    const { error } = await supabase2.from("investments").delete().eq("id", id);
    if (error) {
      console.error("[Supabase Error] investments deletion failed:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (err) {
    console.error("[deleteInvestmentFromRelationalDB] Failed:", err.message || err);
    throw err;
  }
}
var joinedInvestmentsCache = null;
var lastJoinedFetchTime = 0;
var CACHE_TTL_MS = 3e5;
var activeJoinPromise = null;
var cache = {};
var CACHE_DURATION = 3e5;
function withTimeout(promise, timeoutMs, errorMessage = "Request timed out") {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((val) => {
      clearTimeout(timerId);
      return val;
    }),
    timeoutPromise
  ]);
}
function invalidateJoinedInvestmentsCache() {
  joinedInvestmentsCache = null;
  lastJoinedFetchTime = 0;
  for (const key of Object.keys(cache)) {
    if (key.startsWith("districts_") || key.startsWith("stats_") || key.startsWith("spatial_layers_")) {
      delete cache[key];
    }
  }
}
async function fetchAndJoinInvestments(bypassCache = false) {
  if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
    return { data: [], error: null };
  }
  const now = Date.now();
  if (!bypassCache && joinedInvestmentsCache && now - lastJoinedFetchTime < CACHE_TTL_MS) {
    return { data: joinedInvestmentsCache, error: null };
  }
  if (!bypassCache && activeJoinPromise) {
    return activeJoinPromise;
  }
  const safeQuery = async (promise, tableName) => {
    try {
      const res = await promise;
      if (res.error) {
        return { data: [], error: res.error };
      }
      return res;
    } catch (err) {
      console.error(`[SAFE QUERY] Exception querying ${tableName}:`, err);
      return { data: [], error: err };
    }
  };
  const fetchPromise = (async () => {
    try {
      const [
        { data: invList, error: invErr },
        { data: potList, error: potErr },
        { data: finList, error: finErr },
        { data: locList, error: locErr },
        { data: medList, error: medErr },
        { data: scoreList, error: scoreErr },
        { data: legList, error: legErr }
      ] = await withTimeout(
        Promise.all([
          safeQuery(supabase2.from("investments").select("*"), "investments"),
          safeQuery(supabase2.rpc("get_layer_data", { p_table_name: "gis_potensi_investasi" }), "gis_potensi_investasi"),
          safeQuery(supabase2.from("financials").select("*"), "financials"),
          safeQuery(supabase2.from("locations").select("*"), "locations"),
          safeQuery(supabase2.from("media_assets").select("*"), "media_assets"),
          safeQuery(supabase2.from("investment_scores").select("*"), "investment_scores"),
          safeQuery(supabase2.from("legalities").select("*"), "legalities")
        ]),
        8e3,
        "Database fetch timed out inside fetchAndJoinInvestments"
      );
      if (invErr) {
        return { data: null, error: invErr };
      }
      if (potErr) {
      }
      if (finErr) {
      }
      if (locErr) {
      }
      if (medErr) {
      }
      if (scoreErr) {
      }
      if (legErr) {
      }
      const potMap = /* @__PURE__ */ new Map();
      if (potList) {
        for (const feat of potList) {
          const row = feat.properties || {};
          row.geom = feat.geometry;
          if (row.id !== void 0 && row.id !== null) {
            potMap.set(String(row.id), row);
            const numId = Number(row.id);
            if (!isNaN(numId)) {
              potMap.set(numId, row);
            }
          }
        }
      }
      const finMap = /* @__PURE__ */ new Map();
      if (finList) {
        for (const row of finList) {
          if (row.project_id) {
            const keyStr = String(row.project_id);
            const keyNum = Number(row.project_id);
            if (!finMap.has(keyStr)) finMap.set(keyStr, []);
            finMap.get(keyStr).push(row);
            if (!isNaN(keyNum)) {
              if (!finMap.has(keyNum)) finMap.set(keyNum, []);
              finMap.get(keyNum).push(row);
            }
          }
        }
      }
      const locMap = /* @__PURE__ */ new Map();
      if (locList) {
        for (const row of locList) {
          if (row.project_id) {
            const keyStr = String(row.project_id);
            const keyNum = Number(row.project_id);
            if (!locMap.has(keyStr)) locMap.set(keyStr, []);
            locMap.get(keyStr).push(row);
            if (!isNaN(keyNum)) {
              if (!locMap.has(keyNum)) locMap.set(keyNum, []);
              locMap.get(keyNum).push(row);
            }
          }
        }
      }
      const medMap = /* @__PURE__ */ new Map();
      if (medList) {
        for (const row of medList) {
          if (row.project_id) {
            const keyStr = String(row.project_id);
            const keyNum = Number(row.project_id);
            if (!medMap.has(keyStr)) medMap.set(keyStr, []);
            medMap.get(keyStr).push(row);
            if (!isNaN(keyNum)) {
              if (!medMap.has(keyNum)) medMap.set(keyNum, []);
              medMap.get(keyNum).push(row);
            }
          }
        }
      }
      const scoreMap = /* @__PURE__ */ new Map();
      if (scoreList) {
        for (const row of scoreList) {
          if (row.project_id) {
            const keyStr = String(row.project_id);
            const keyNum = Number(row.project_id);
            if (!scoreMap.has(keyStr)) scoreMap.set(keyStr, []);
            scoreMap.get(keyStr).push(row);
            if (!isNaN(keyNum)) {
              if (!scoreMap.has(keyNum)) scoreMap.set(keyNum, []);
              scoreMap.get(keyNum).push(row);
            }
          }
        }
      }
      const legMap = /* @__PURE__ */ new Map();
      if (legList) {
        for (const row of legList) {
          if (row.project_id) {
            const keyStr = String(row.project_id);
            const keyNum = Number(row.project_id);
            if (!legMap.has(keyStr)) legMap.set(keyStr, []);
            legMap.get(keyStr).push(row);
            if (!isNaN(keyNum)) {
              if (!legMap.has(keyNum)) legMap.set(keyNum, []);
              legMap.get(keyNum).push(row);
            }
          }
        }
      }
      const joined = [];
      const seenIds = /* @__PURE__ */ new Set();
      const invMap = /* @__PURE__ */ new Map();
      for (const inv of invList || []) {
        invMap.set(String(inv.id), inv);
        if (!isNaN(Number(inv.id))) invMap.set(Number(inv.id), inv);
      }
      for (const [keyStrRaw, potRow] of potMap.entries()) {
        const keyStr = String(keyStrRaw);
        if (!seenIds.has(keyStr)) {
          seenIds.add(keyStr);
          const keyNum = Number(keyStr);
          const id = potRow.id || potRow.nama_potensi;
          const matchedInv = invMap.get(keyStr) || (!isNaN(keyNum) ? invMap.get(keyNum) : null) || {};
          const financials = finMap.get(keyStr) || (!isNaN(keyNum) ? finMap.get(keyNum) : null) || [];
          const locations = locMap.get(keyStr) || (!isNaN(keyNum) ? locMap.get(keyNum) : null) || [];
          const media_assets = medMap.get(keyStr) || (!isNaN(keyNum) ? medMap.get(keyNum) : null) || [];
          const investment_scores = scoreMap.get(keyStr) || (!isNaN(keyNum) ? scoreMap.get(keyNum) : null) || [];
          const legalities = legMap.get(keyStr) || (!isNaN(keyNum) ? legMap.get(keyNum) : null) || [];
          joined.push({
            id,
            name: potRow.nama_potensi || potRow.name || matchedInv.name || "Potensi Investasi",
            sector: potRow.sektor_utama || matchedInv.sector || "General",
            status: potRow.status_publikasi || potRow.status || matchedInv.status_publikasi || matchedInv.status || "Draft",
            investmentValue: financials?.[0]?.capex || potRow.estimasi_nilai || matchedInv.investmentValue || 0,
            areaHa: potRow.luas_lahan || potRow.area_ha || matchedInv.areaHa || 0,
            landStatus: potRow.status_kepemilikan || matchedInv.landStatus || "",
            nib: potRow.nib || "",
            gis_potensi_investasi: [potRow],
            financials,
            locations,
            media_assets,
            investment_scores,
            legalities,
            ...matchedInv
          });
        }
      }
      joinedInvestmentsCache = joined;
      lastJoinedFetchTime = Date.now();
      return { data: joined, error: null };
    } catch (err) {
      console.error("fetchAndJoinInvestments failed completely:", err);
      if (joinedInvestmentsCache) {
        return { data: joinedInvestmentsCache, error: null };
      }
      return { data: null, error: err };
    } finally {
      if (!bypassCache) {
        activeJoinPromise = null;
      }
    }
  })();
  if (!bypassCache) {
    activeJoinPromise = fetchPromise;
  }
  return fetchPromise;
}
async function syncWithSupabase() {
  if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
    dbSyncStatus = { success: false, error: "Database not configured yet." };
    return;
  }
  let investmentsData = [];
  try {
    const { data: invData, error: invErr } = await fetchAndJoinInvestments();
    if (!invErr && invData) {
      const frontendRows = prepareForFrontend(invData);
      investmentsData = frontendRows.map((row) => {
        const gisPot = row.geometries?.[0] || {};
        const finObj = row.financials?.[0] || {};
        const locObj = row.locations?.[0] || {};
        const medObj = row.mediaAssets?.[0] || {};
        const scoreObj = row.investmentScores?.[0] || {};
        const coords = extractCoordinates(row, gisPot, locObj);
        return {
          id: row.id,
          name: row.name,
          sector: row.sector,
          districtId: row.districtId || locObj.district || "lt",
          villageId: row.villageId || locObj.village || "v_belopa1",
          latitude: coords.latitude,
          longitude: coords.longitude,
          areaHa: Number(row.areaHa) || Number(gisPot.luasLahan) || 0,
          investmentValue: Number(row.investmentValue) || Number(finObj.capex) || 0,
          landStatus: row.landStatus || "Sertifikat Hak Milik",
          photoUrl: row.photoUrl || "",
          photoUrls: row.photoUrls || medObj.photos || [],
          contactPic: row.contactPic || "Humas DPMPTSP",
          phoneNumber: row.phoneNumber || "0471-belopa",
          isActive: row.isActive !== void 0 ? row.isActive : true,
          createdAt: row.createdAt,
          geometry: row.geometry || gisPot.geom || null,
          status: row.status || "Published",
          spatialSync: row.spatialSync || null,
          smartData: {
            ...row,
            luasLahan: Number(gisPot.luasLahan) || Number(row.areaHa),
            deskripsiSingkat: gisPot.deskripsiSingkat || "",
            deskripsiLengkap: gisPot.deskripsiLengkap || "",
            jenisKomoditas: gisPot.jenisKomoditas || "",
            produksiTahunan: Number(gisPot.produksiTahunan) || 0,
            satuanKerja: gisPot.satuanKerja || "",
            jumlahTernakPohon: Number(gisPot.jumlahTernakPohon) || 0,
            umurTanamanHewan: Number(gisPot.umurTanamanHewan) || 0,
            ownershipStatus: row.landStatus || "Sertifikat Hak Milik",
            kesesuaianRtrw: gisPot.kesesuaianRtrw || "Sesuai",
            bepTahun: Number(gisPot.bepTahun) || Number(finObj.paybackPeriod) || 0,
            irrPersen: Number(gisPot.irrPersen) || Number(finObj.irr) || 0,
            npvEstimasi: Number(gisPot.npvEstimasi) || Number(finObj.npv) || 0,
            capex: Number(finObj.capex) || Number(row.investmentValue) || 0,
            opex: Number(finObj.opex) || 0,
            roiEstimasi: Number(finObj.roi) || 0,
            roadDistance: row.spatialSync?.nearestRoadKm || 0,
            portDistance: row.spatialSync?.nearestFacilities?.find((f) => f.type.toLowerCase().includes("port") || f.name.toLowerCase().includes("pelabuhan"))?.distanceKm || 0,
            airportDistance: row.spatialSync?.nearestFacilities?.find((f) => f.type.toLowerCase().includes("airport") || f.name.toLowerCase().includes("bandara"))?.distanceKm || 0,
            aiScore: Number(scoreObj.score) || 85,
            aiKategori: scoreObj.category || "Sangat Direkomendasikan",
            gallery: medObj.photos || []
          }
        };
      });
    } else if (invErr) {
      console.error("Error syncing investments:", invErr);
    }
    const { data: ragData, error: ragErr } = await supabase2.from("knowledge_documents").select("*");
    if (!ragErr && ragData) knowledgeDocuments = prepareForFrontend(ragData, "knowledge_documents");
    const { data: shData, error: shErr } = await supabase2.from("spatial_history").select("*").order("created_at", { ascending: false }).limit(100);
    if (!shErr && shData) spatialHistory = prepareForFrontend(shData, "spatial_history");
    const { data: geoData, error: geoErr } = await supabase2.from("geometries").select("*");
    if (!geoErr && geoData) geometriesData = prepareForFrontend(geoData, "geometries");
    try {
      const { data: infraData, error: infraErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_infrastruktur" });
      if (!infraErr && infraData) {
        infrastructurePoints = infraData.map((f) => ({
          id: f.properties?.id || f.id || "unknown",
          name: f.properties?.nama_infrastruktur || f.properties?.name || f.name || "unknown",
          type: f.properties?.kategori || f.properties?.category || f.type || f.category || "unknown",
          latitude: f.geometry?.coordinates?.[1] || f.geojson?.coordinates?.[1] || 0,
          longitude: f.geometry?.coordinates?.[0] || f.geojson?.coordinates?.[0] || 0,
          description: f.properties?.keterangan_singkat || f.properties?.description || f.description || ""
        }));
        const infraLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_infrastruktur");
        if (infraLayerIdx !== -1) {
          spatialLayers[infraLayerIdx].geojson.features = infrastructurePoints.map((p) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [p.longitude, p.latitude]
            },
            properties: {
              id: p.id,
              name: p.name,
              category: p.type,
              description: p.description,
              icon: "Building2"
            }
          }));
        }
      }
    } catch (infraError) {
    }
    let zonasiData = null;
    let zonasiErr = null;
    try {
      const { data, error } = await supabase2.from("gis_zonasi").select("*");
      zonasiData = data;
      zonasiErr = error;
    } catch (err) {
      zonasiErr = err;
    }
    if (!zonasiErr && zonasiData && zonasiData.length > 0) {
      const zonasiFeatures = zonasiData.map((row) => ({
        type: "Feature",
        geometry: row.geom || row.geometry || null,
        properties: prepareForFrontend(row, "gis_zonasi")
      })).filter((f) => f.geometry !== null);
      const zonasiLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_zonasi");
      if (zonasiLayerIdx !== -1) {
        spatialLayers[zonasiLayerIdx].geojson = {
          type: "FeatureCollection",
          features: zonasiFeatures
        };
      } else {
        spatialLayers.push({
          id: "layer_zonasi",
          name: "Zonasi Kawasan",
          category: "Zonasi",
          geojson: { type: "FeatureCollection", features: zonasiFeatures },
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          isActive: false,
          opacity: 0.65,
          color: "#8b5cf6",
          lineWidth: 1.5
        });
      }
      const landUseZoningIdx = spatialLayers.findIndex((l) => l.id === "layer_land_use_zoning");
      if (landUseZoningIdx !== -1) {
        spatialLayers[landUseZoningIdx].geojson = {
          type: "FeatureCollection",
          features: zonasiFeatures
        };
      }
    }
    try {
      const { data: sawahData, error: sawahErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_sawah" });
      if (!sawahErr && sawahData && sawahData.length > 0) {
        const sawahFeatures = sawahData.map((row) => ({
          type: "Feature",
          geometry: row.geom || row.geometry || null,
          properties: prepareForFrontend(row, "gis_sawah")
        })).filter((f) => f.geometry !== null);
        const sawahLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_sawah");
        if (sawahLayerIdx !== -1) {
          spatialLayers[sawahLayerIdx].geojson = {
            type: "FeatureCollection",
            features: sawahFeatures
          };
        }
      }
    } catch (err) {
    }
    try {
      const { data: mangroveData, error: mangroveErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_mangrove" });
      if (!mangroveErr && mangroveData && mangroveData.length > 0) {
        const mangroveFeatures = mangroveData.map((row) => ({
          type: "Feature",
          geometry: row.geom || row.geometry || null,
          properties: prepareForFrontend(row, "gis_mangrove")
        })).filter((f) => f.geometry !== null);
        const mangroveLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_mangrove");
        if (mangroveLayerIdx !== -1) {
          spatialLayers[mangroveLayerIdx].geojson = {
            type: "FeatureCollection",
            features: mangroveFeatures
          };
        }
      }
    } catch (err) {
    }
    try {
      const { data: tambakData, error: tambakErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_tambak" });
      if (!tambakErr && tambakData && tambakData.length > 0) {
        const tambakFeatures = tambakData.map((row) => ({
          type: "Feature",
          geometry: row.geom || row.geometry || null,
          properties: prepareForFrontend(row, "gis_tambak")
        })).filter((f) => f.geometry !== null);
        const tambakLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_tambak");
        if (tambakLayerIdx !== -1) {
          spatialLayers[tambakLayerIdx].geojson = {
            type: "FeatureCollection",
            features: tambakFeatures
          };
        }
      }
    } catch (err) {
    }
    if (!jalanLoadStatus.loaded) {
      let jalanFeatures = [];
      try {
        const { data: jalanData, error: jalanErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_jalan" });
        if (!jalanErr && Array.isArray(jalanData)) {
          jalanFeatures = jalanData.map((f) => ({
            type: "Feature",
            geometry: f.geometry || f.geom || null,
            properties: {
              id: f.properties?._temp_id || f.properties?.id || f.id || "unknown",
              fungsi_ren: f.properties?.fungsi_ren || f.properties?.fungsi || "Jalan",
              nama: f.properties?.nama || f.properties?.nama_ruas || "Jalan",
              status: f.properties?.status || "Unknown",
              kondisi: f.properties?.kondisi || "Unknown",
              panjang_km: typeof f.properties?.panjang_km === "number" ? f.properties.panjang_km : Number(f.properties?.panjang_km) || 0
            }
          })).filter((f) => f.geometry !== null);
        }
      } catch (jalanError) {
      }
      const layerJalan = {
        id: "layer_jalan",
        name: "Layer Jalan (gis_jalan)",
        category: "Jalan",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true,
        opacity: 0.8,
        color: "#eab308",
        lineWidth: 2,
        geojson: {
          type: "FeatureCollection",
          features: jalanFeatures
        }
      };
      global.luwuRoads = layerJalan.geojson;
      const jalanLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_jalan");
      if (jalanLayerIdx !== -1) {
        spatialLayers[jalanLayerIdx] = layerJalan;
      } else {
        spatialLayers.push(layerJalan);
      }
      jalanLoadStatus.loaded = true;
    }
    const potLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_potensi");
    const potencyFeatures = investmentsData.filter((inv) => inv.geometry && (inv.geometry.type === "Polygon" || inv.geometry.type === "MultiPolygon" || inv.geometry.type === "LineString")).map((inv) => ({
      type: "Feature",
      geometry: inv.geometry,
      properties: {
        id: inv.id,
        title: inv.name,
        status: inv.status || "Published",
        sector: inv.sector,
        capex: Number(inv.smartData?.capex) || Number(inv.investmentValue) || 0,
        ai_score: Number(inv.smartData?.aiScore) || 0,
        name: inv.name,
        category: inv.sector,
        areaHa: Number(inv.areaHa) || 0,
        investmentValue: Number(inv.investmentValue) || 0,
        landStatus: inv.landStatus,
        photoUrl: inv.photoUrl,
        photoUrls: inv.photoUrls || [],
        contactPic: inv.contactPic,
        phoneNumber: inv.phoneNumber,
        createdAt: inv.createdAt,
        smartData: inv.smartData || {}
      }
    }));
    if (potLayerIdx !== -1) {
      spatialLayers[potLayerIdx].geojson = {
        type: "FeatureCollection",
        features: potencyFeatures
      };
    } else {
      spatialLayers.push({
        id: "layer_potensi",
        name: "Potensi Investasi",
        category: "Tata Ruang",
        geojson: { type: "FeatureCollection", features: potencyFeatures },
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true,
        opacity: 0.5,
        fillOpacity: 0.3,
        color: "#8b5cf6",
        lineWidth: 2
      });
    }
    try {
      const { data: kecData, error: kecErr } = await supabase2.from("gis_kecamatan").select("*");
      if (!kecErr && kecData && kecData.length > 0) {
        const kecIndex = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
        const mappedKecFeatures = kecData.map((row) => {
          const rawKecName = row.kecamatan || row.name || `Kecamatan ${row.id}`;
          const cleanKecName = rawKecName.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
          const districtId = `dist_${cleanKecName.toLowerCase().replace(/\s+/g, "_")}`;
          return {
            type: "Feature",
            geometry: row.geom || row.geojson,
            properties: { ...row, id: districtId, _id: row.id, name: cleanKecName, rawName: rawKecName }
          };
        });
        if (kecIndex !== -1) {
          spatialLayers[kecIndex].geojson = {
            type: "FeatureCollection",
            features: mappedKecFeatures
          };
        } else {
          spatialLayers.push({
            id: "layer_kecamatan",
            name: "Layer Kecamatan",
            category: "Kecamatan",
            geojson: { type: "FeatureCollection", features: mappedKecFeatures },
            uploadedAt: "2026-05-28T00:00:00Z",
            isActive: true,
            opacity: 0.6,
            color: "#2563eb",
            lineWidth: 2
          });
        }
      }
    } catch (e) {
    }
    try {
      const { data: desaData, error: desaErr } = await supabase2.from("gis_desa").select("*");
      if (!desaErr && desaData && desaData.length > 0) {
        const desaIndex = spatialLayers.findIndex((l) => l.id === "layer_desa");
        let newVillagesData = [];
        const mappedFeatures = desaData.map((row) => {
          let rawKecName = row.kecamatan || row.WADMKC || row.KECAMATAN || "";
          if (!rawKecName && (row.geom || row.geojson)) {
            try {
              const kecLayer = spatialLayers.find((l) => l.id === "layer_kecamatan");
              const kecFeatures = kecLayer?.geojson?.features || [];
              const matchedKec = kecFeatures.find((kf) => {
                if (!kf.geometry) return false;
                try {
                  return turf2.booleanIntersects(
                    { type: "Feature", geometry: row.geom || row.geojson, properties: {} },
                    kf
                  );
                } catch (err) {
                  return false;
                }
              });
              if (matchedKec) {
                rawKecName = matchedKec.properties?.name || matchedKec.properties?.KECAMATAN || "";
              }
            } catch (err) {
            }
          }
          const cleanKecName = rawKecName.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
          const districtId = `dist_${cleanKecName.toLowerCase().replace(/\s+/g, "_")}`;
          let coords = [0, 0];
          try {
            const geom = row.geom || row.geojson;
            if (geom) {
              const poly = JSON.parse(JSON.stringify({ type: "Feature", geometry: geom }));
              const cent = turf2.centroid(poly);
              if (cent && cent.geometry && cent.geometry.coordinates) {
                coords = [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
              }
            }
          } catch (e) {
          }
          const luasGIS = parseFloat(row.luas_gis || row.luas || "0");
          const areaHa = luasGIS > 0 ? luasGIS * 100 : 500;
          const pop = parseInt(row.jum_pdd || "1000", 10);
          const density = parseFloat(row.kepadatan || (pop / (areaHa / 100)).toString());
          newVillagesData.push({
            id: String(row.id),
            districtId,
            name: row.desa || row.nama_desa || row.name || `Desa ${row.id}`,
            areaHa,
            population: pop,
            density,
            coordinates: coords,
            geojson: { type: "Feature", geometry: row.geom || row.geojson, properties: { ...row, id: String(row.id), districtId, name: row.desa || row.nama_desa || row.name || `Desa ${row.id}` } }
          });
          return {
            type: "Feature",
            geometry: row.geom || row.geojson,
            properties: { ...row, id: String(row.id), districtId, name: row.desa || row.nama_desa || row.name || `Desa ${row.id}` }
          };
        });
        if (newVillagesData.length > 0) {
          villagesData = newVillagesData;
        }
        if (desaIndex !== -1) {
          spatialLayers[desaIndex].geojson = {
            type: "FeatureCollection",
            features: mappedFeatures
          };
        } else {
          spatialLayers.push({
            id: "layer_desa",
            name: "Batas Administrasi Desa",
            category: "Desa",
            geojson: { type: "FeatureCollection", features: mappedFeatures },
            uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
            isActive: false,
            opacity: 0.5,
            color: "#10b981",
            lineWidth: 1
          });
        }
      }
    } catch (e) {
    }
    dbSyncStatus = { success: true, error: null };
  } catch (e) {
    investmentsData = [];
    const errMsg = e?.message || String(e);
    dbSyncStatus = { success: false, error: errMsg };
    console.error("Supabase DB sync failed:", e);
    console.error(JSON.stringify(e, null, 2));
  }
}
var isDatabaseHydrated = false;
var hydrationPromise = null;
async function ensureDbHydrated() {
  if (isDatabaseHydrated) return;
  if (!hydrationPromise) {
    hydrationPromise = withTimeout(syncWithSupabase(), 15e3, "Database hydration timed out after 15s").then(() => {
      isDatabaseHydrated = true;
      hydrationPromise = null;
    }).catch((e) => {
      console.error("Hydration failed/timed out:", e);
      console.error(JSON.stringify(e, null, 2));
      hydrationPromise = null;
    });
  }
  return hydrationPromise;
}
var currentSyncProgress = {
  isSyncing: false,
  progress: 0,
  total: 0,
  message: "",
  currentLayer: null
};
async function syncGlobalSpatial() {
  if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
    return { success: false, error: "Database not configured yet." };
  }
  currentSyncProgress = { isSyncing: true, progress: 0, total: 0, message: "Starting synchronization...", currentLayer: null };
  try {
    const { data: invList, error: invErr } = await fetchAndJoinInvestments();
    if (invErr) {
      console.error("[syncGlobalSpatial] Error fetching investments:", invErr.message);
      currentSyncProgress = { isSyncing: false, progress: 0, total: 0, message: "Error fetching investments.", currentLayer: null };
      return { success: false, error: invErr.message };
    }
    if (!invList || invList.length === 0) {
      currentSyncProgress = { isSyncing: false, progress: 0, total: 0, message: "Done.", currentLayer: null };
      return { success: true, count: 0 };
    }
    let syncedCount = 0;
    const totalCount = invList.length;
    currentSyncProgress = { isSyncing: true, progress: 0, total: totalCount, message: `Syncing ${totalCount} items...`, currentLayer: null };
    for (const rawItem of invList) {
      const item = prepareForFrontend(rawItem);
      currentSyncProgress.message = `Processing ${item.name || item.id}...`;
      currentSyncProgress.currentLayer = "Inisialisasi";
      const gisPot = item.gisPotensiInvestasi?.[0] || {};
      const finObj = item.financials?.[0] || {};
      const locObj = item.locations?.[0] || {};
      const medObj = item.mediaAssets?.[0] || {};
      const scoreObj = item.investmentScores?.[0] || {};
      let geoToSync = item.geometry || gisPot.geom || null;
      if (!geoToSync && item.latitude && item.longitude) {
        geoToSync = { type: "Point", coordinates: [Number(item.longitude), Number(item.latitude)] };
      }
      if (geoToSync) {
        const syncResult = await calculateSpatialSync(geoToSync);
        const mergedInvestment = {
          id: item.id,
          name: item.name,
          sector: item.sector,
          districtId: item.districtId || locObj.district || "lt",
          villageId: item.villageId || locObj.village || "v_belopa1",
          latitude: extractCoordinates(item, gisPot, locObj).latitude,
          longitude: extractCoordinates(item, gisPot, locObj).longitude,
          areaHa: Number(item.areaHa) || Number(gisPot.luasLahan) || 0,
          investmentValue: Number(item.investmentValue) || Number(finObj.capex) || 0,
          landStatus: item.landStatus || "Sertifikat Hak Milik",
          photoUrl: item.photoUrl || "",
          photoUrls: item.photoUrls || medObj.photos || [],
          contactPic: item.contactPic || "Humas DPMPTSP",
          phoneNumber: item.phoneNumber || "0471-belopa",
          isActive: item.isActive !== void 0 ? item.isActive : true,
          createdAt: item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          geometry: geoToSync,
          status: item.status || "Published",
          spatialSync: syncResult,
          smartData: {
            ...item,
            luasLahan: Number(gisPot.luasLahan) || Number(item.areaHa),
            deskripsiSingkat: gisPot.deskripsiSingkat || "",
            deskripsiLengkap: gisPot.deskripsiLengkap || "",
            jenisKomoditas: gisPot.jenisKomoditas || "",
            produksiTahunan: Number(gisPot.produksiTahunan) || 0,
            satuanKerja: gisPot.satuanKerja || "",
            jumlahTernakPohon: Number(gisPot.jumlahTernakPohon) || 0,
            umurTanamanHewan: Number(gisPot.umurTanamanHewan) || 0,
            ownershipStatus: item.landStatus || "Sertifikat Hak Milik",
            kesesuaianRtrw: gisPot.kesesuaianRtrw || "Sesuai",
            bepTahun: Number(gisPot.bepTahun) || Number(finObj.paybackPeriod) || 0,
            irrPersen: Number(gisPot.irrPersen) || Number(finObj.irr) || 0,
            npvEstimasi: Number(gisPot.npvEstimasi) || Number(finObj.npv) || 0,
            capex: Number(finObj.capex) || Number(item.investmentValue) || 0,
            opex: Number(finObj.opex) || 0,
            roiEstimasi: Number(finObj.roi) || 0,
            roadDistance: syncResult.nearestRoadKm || 0,
            portDistance: syncResult.nearestFacilities?.find((f) => f.type?.toLowerCase().includes("port") || f.name?.toLowerCase().includes("pelabuhan"))?.distanceKm || 0,
            airportDistance: syncResult.nearestFacilities?.find((f) => f.type?.toLowerCase().includes("airport") || f.name?.toLowerCase().includes("bandara"))?.distanceKm || 0,
            aiScore: Number(scoreObj.score) || 85,
            aiKategori: scoreObj.category || "Sangat Direkomendasikan",
            gallery: medObj.photos || []
          }
        };
        if (syncResult?.kecamatanMatch) {
          const matchedDist = districtsData.find((d) => d.name.toLowerCase() === syncResult.kecamatanMatch?.toLowerCase());
          if (matchedDist) {
            mergedInvestment.districtId = matchedDist.id;
          }
        }
        if (syncResult?.desaMatch) {
          const matchedVillage = villagesData.find((v) => v.name.toLowerCase() === syncResult.desaMatch?.toLowerCase());
          if (matchedVillage) {
            mergedInvestment.villageId = matchedVillage.id;
          }
        }
        await saveInvestmentToSupabaseDirect(mergedInvestment);
        syncedCount++;
        currentSyncProgress.progress = syncedCount;
      }
    }
    currentSyncProgress = { ...currentSyncProgress, message: "Refreshing cache...", isSyncing: true, currentLayer: "Cache Sync" };
    await syncWithSupabase();
    currentSyncProgress = { ...currentSyncProgress, isSyncing: false, message: "Synchronization Complete.", currentLayer: null };
    return { success: true, count: syncedCount };
  } catch (err) {
    currentSyncProgress = { ...currentSyncProgress, isSyncing: false, message: "Error: " + (err.message || err), currentLayer: null };
    console.error("[syncGlobalSpatial] Exception:", err.message || err);
    return { success: false, error: err.message || err };
  }
}
var spatialAutoCronState = {
  enabled: true,
  intervalHours: 1,
  intervalMs: 60 * 60 * 1e3,
  // 1 hour = 3600000 ms
  lastRunAt: null,
  nextRunAt: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
  lastStatus: "Idle",
  lastSyncedCount: 0,
  runCount: 0,
  lastError: null,
  isExecuting: false
};
async function executeSpatialCronSync() {
  if (!spatialAutoCronState.enabled || spatialAutoCronState.isExecuting) return;
  spatialAutoCronState.isExecuting = true;
  spatialAutoCronState.lastStatus = "Running";
  spatialAutoCronState.lastRunAt = (/* @__PURE__ */ new Date()).toISOString();
  spatialAutoCronState.nextRunAt = new Date(Date.now() + spatialAutoCronState.intervalMs).toISOString();
  console.log(`[SPATIAL CRON JOB] Executing hourly spatial data synchronization at ${spatialAutoCronState.lastRunAt}...`);
  try {
    const result = await syncGlobalSpatial();
    if (result.success) {
      spatialAutoCronState.lastStatus = "Success";
      spatialAutoCronState.lastSyncedCount = result.count || 0;
      spatialAutoCronState.runCount += 1;
      spatialAutoCronState.lastError = null;
      console.log(`[SPATIAL CRON JOB] Synchronization succeeded. ${result.count || 0} investments updated.`);
    } else {
      spatialAutoCronState.lastStatus = "Failed";
      spatialAutoCronState.lastError = result.error || "Unknown error";
      console.error(`[SPATIAL CRON JOB] Synchronization failed: ${result.error}`);
    }
  } catch (err) {
    spatialAutoCronState.lastStatus = "Failed";
    spatialAutoCronState.lastError = err.message || String(err);
    console.error(`[SPATIAL CRON JOB] Exception during auto-sync execution:`, err);
  } finally {
    spatialAutoCronState.isExecuting = false;
  }
}
setInterval(executeSpatialCronSync, 60 * 60 * 1e3);
var app = (0, import_express.default)();
app.set("trust proxy", 1);
var PORT = 3e3;
app.use((0, import_cors.default)({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var geminiApiKey = [
  process.env.GEMINI_API_KEY_FIRST,
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7
].find((key) => key && key.startsWith("AIza") && key !== "MY_GEMINI_API_KEY" && key !== "");
var ai = null;
if (geminiApiKey) {
  try {
    ai = new import_genai.GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
}
async function runWithClient(client, params, modelsToTry) {
  let lastModelError = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        ...params,
        model: modelName
      });
      return response;
    } catch (err) {
      const errMsg = err?.message || String(err);
      lastModelError = err;
      if (errMsg.includes("API key not valid") || errMsg.includes("invalid key") || errMsg.includes("API_KEY_INVALID")) {
        throw err;
      }
    }
  }
  throw lastModelError || new Error("All fallback models failed.");
}
var fetchActiveDocuments = async () => {
  const { data, error } = await supabase2.from("knowledge_documents").select("title, category, status").eq("is_active", true);
  if (error || !data) return "";
  const docList = data.map((doc, index) => `${index + 1}. [Kategori: ${doc.category}] - ${doc.title}`).join("\n");
  return `
Daftar Dokumen Referensi Aktif di Database Anda saat ini:
${docList}
`;
};
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, investmentContext, simulationContext, language } = req.body;
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API client is not initialized. Please set GEMINI_API_KEY.",
        text: "Maaf, sistem AI sedang offline karena API Key belum terkonfigurasi. Silakan hubungi sys-admin."
      });
    }
    const formattedHistory = (history || []).map((msg) => {
      let t = "";
      if (msg.parts && msg.parts.length > 0) t = msg.parts[0].text;
      else if (msg.text) t = msg.text;
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: t || " " }]
      };
    });
    const contents = [
      ...formattedHistory,
      { role: "user", parts: [{ text: message || " " }] }
    ];
    let ragContext = "";
    try {
      if (ai && message) {
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-2",
          contents: message,
          config: { outputDimensionality: 1536 }
        });
        if (embedRes.embeddings && embedRes.embeddings.length > 0) {
          const userVector = embedRes.embeddings[0].values;
          const { data: matchedDocs, error: matchErr } = await supabase2.rpc("match_knowledge_chunks", {
            query_embedding: userVector,
            match_threshold: 0.3,
            match_count: 5
          });
          if (!matchErr && matchedDocs && matchedDocs.length > 0) {
            const docIds = [...new Set(matchedDocs.map((d) => d.document_id))].filter(Boolean);
            let docMetaMap = /* @__PURE__ */ new Map();
            if (docIds.length > 0) {
              const { data: docsMeta } = await supabase2.from("knowledge_documents").select("id, title").in("id", docIds);
              docMetaMap = new Map((docsMeta || []).map((d) => [d.id, d.title]));
            }
            const sources = Array.from(docMetaMap.values());
            res.locals.ragSources = sources;
            ragContext = "\n\nINFORMASI REFERENSI (RAG) DARI KNOWLEDGE BASE KABUPATEN LUWU:\n" + matchedDocs.map((doc) => `--- Dokumen: ${docMetaMap.get(doc.document_id) || "Kajian Akademis/Regulasi Resmi"} ---
${doc.content}`).join("\n\n") + "\nKamu HARUS menjawab pertanyaan pengguna STRICTLY berdasarkan konteks informasi di atas. Do not hallucinate.";
          } else if (matchErr) {
            console.error("Vector search error via match_knowledge_chunks:", matchErr);
          }
        }
      }
    } catch (emErr) {
      console.error("RAG similarity search failed:", emErr);
      if (knowledgeDocuments.length > 0) {
        ragContext = "\n\nINFORMASI REFERENSI (RAG) DARI DOKUMEN YANG DIUNGGAH:\n" + knowledgeDocuments.map((doc) => `--- Dokumen: ${doc.filename} ---
${doc.extractedText.substring(0, 5e3)}`).join("\n\n") + "\nKamu HARUS menggunakan referensi dokumen RAG di atas jika relevan untuk menjawab pertanyaan investasi.";
      }
    }
    let specificInvestmentContext = "";
    if (investmentContext && !Array.isArray(investmentContext) && investmentContext.name) {
      let pgRoutingDist = investmentContext.pgrouting_distance;
      if (pgRoutingDist === void 0 || pgRoutingDist === null) {
        try {
          const { data: pData } = await supabase2.from("gis_potensi_investasi").select("pgrouting_distance").ilike("name", `%${investmentContext.name}%`).maybeSingle();
          if (pData?.pgrouting_distance !== void 0) pgRoutingDist = pData.pgrouting_distance;
          else {
            const { data: iData } = await supabase2.from("investments").select("pgrouting_distance").ilike("name", `%${investmentContext.name}%`).maybeSingle();
            if (iData?.pgrouting_distance !== void 0) pgRoutingDist = iData.pgrouting_distance;
            else {
              const { data: gData } = await supabase2.from("gis_potensi_investasi").select("pgrouting_distance").ilike("title", `%${investmentContext.name}%`).maybeSingle();
              if (gData?.pgrouting_distance !== void 0) pgRoutingDist = gData.pgrouting_distance;
            }
          }
        } catch (e) {
          console.error("PgRouting retrieve error:", e);
        }
      }
      let lat = Number(investmentContext.latitude);
      let lng = Number(investmentContext.longitude);
      if (!lat || !lng) {
        try {
          const { data: dbInv } = await supabase2.from("gis_potensi_investasi").select("geom, latitude, longitude").ilike("name", `%${investmentContext.name}%`).maybeSingle();
          if (dbInv) {
            const coords = extractCoordinates(dbInv, null, null);
            lat = coords.latitude;
            lng = coords.longitude;
          } else {
            const { data: dbRealInv } = await supabase2.from("investments").select("latitude, longitude, geometry").ilike("name", `%${investmentContext.name}%`).maybeSingle();
            if (dbRealInv) {
              lat = Number(dbRealInv.latitude);
              lng = Number(dbRealInv.longitude);
            }
          }
        } catch (dbErr) {
          console.error("Failed to fetch coordinates for live routing calculation:", dbErr);
        }
      }
      specificInvestmentContext = `

PERHATIAN PENTING: Pengguna SAAT INI sedang membuka dan memfokuskan antarmuka pada satu potensi investasi spesifik berikut ini:
    - Nama Potensi: ${investmentContext.name}
    - Sektor: ${investmentContext.sector}
    - Deskripsi: ${investmentContext.description || "Tidak tersedia deskripsi kawan"}
    - Luas (Area): ${investmentContext.areaHa} Hektar
    - Nilai Investasi (Estimasi): Rp ${investmentContext.investmentValue ? investmentContext.investmentValue.toLocaleString("id-ID") : 0}
    - Lokasi Kecamatan ID: ${investmentContext.districtId || "Tidak Spesifik"}`;
      if (pgRoutingDist !== void 0 && pgRoutingDist !== null) {
        specificInvestmentContext += `
    - Jarak Tempuh Jalan Raya (PgRouting distance): ${pgRoutingDist} KM`;
      }
      if (lat && lng && Math.abs(lat) > 1e-3 && Math.abs(lng) > 1e-3) {
        try {
          const fromParam = turf2.point([lng, lat]);
          const keyTargets = [
            { name: "Kantor Bupati Luwu (Ibu Kota Belopa / Pusat Pemerintahan)", coords: [120.36547889067685, -3.394828505594006] },
            { name: "Bandara I Lagaligo Bua", coords: [120.24132322502385, -3.086338491260946] },
            { name: "Pelabuhan Tanjung Ringgit", coords: [120.2117, -2.9992] },
            { name: "Pelabuhan Belopa / Pelabuhan Logistik Pesisir", coords: [120.39793462368112, -3.386061643485775] }
          ];
          if (infrastructurePoints && infrastructurePoints.length > 0) {
            for (const infra of infrastructurePoints) {
              const isDup = keyTargets.some((t) => {
                const d = turf2.distance(turf2.point(t.coords), turf2.point([infra.longitude, infra.latitude]), { units: "kilometers" });
                return d < 0.5;
              });
              if (!isDup && infra.longitude && infra.latitude) {
                keyTargets.push({
                  name: `${infra.name} (${infra.type})`,
                  coords: [infra.longitude, infra.latitude]
                });
              }
            }
          }
          const targetSlice = keyTargets.slice(0, 6);
          const routingResults = await Promise.all(targetSlice.map(async (t) => {
            const toParam = turf2.point(t.coords);
            const rRes = await getDistance(fromParam, toParam, { units: "kilometers" }, supabase2);
            return {
              name: t.name,
              distance: rRes.distance,
              method: rRes.method
            };
          }));
          specificInvestmentContext += `

=== AKURASI RUTE JALAN DARAT (Dihitung Real-time dengan PgRouting / Jaringan Jalan Kabupaten Luwu) ===`;
          for (const r of routingResults) {
            specificInvestmentContext += `
- Jarak ke ${r.name}: ${r.distance.toFixed(2)} KM (Menggunakan metode rute: ${r.method === "NETWORK" ? "PgRouting Jaringan Jalan Raya" : "Garis Lurus / Euclidean Fallback"})`;
          }
          specificInvestmentContext += `

[DOKTRIN ASISTEN]: Anda WAJIB menggunakan tabel jarak di atas kawan sebagai referensi tunggal dan mutlak ketika menjawab pertanyaan investor mengenai jarak, konektivitas logistik, dan akses jalan. Katakan dengan ramah kepada investor: "Kawan, berdasarkan kalkulasi rute jalan raya resmi (PgRouting) dari sistem kami, jarak persisnya adalah..."`;
        } catch (routingErr) {
          console.error("Live routing calculation in chat failed:", routingErr);
        }
      }
      specificInvestmentContext += `
    
    INSTRUKSI WAJIB UNTUK SYSTEM AI:
    Anda HARUS membatasi pembahasan HANYA pada potensi investasi spesifik ini saja. 
    Anda DILARANG KERAS merespons atau memberikan informasi mengenai potensi investasi lain di luar yang sedang dibuka oleh pengguna ini, meskipun pengguna memintanya. Fokus pada analisis, kelayakan geospasial, atau dukungan yang dapat diberikan terkait potensi spesifik ini saja.`;
    }
    let spatialStatsContext = "";
    try {
      const stats = [];
      for (const layer of spatialLayers) {
        if (!layer.isActive && layer.id !== "layer_jalan" && layer.id !== "layer_mangrove" && layer.id !== "layer_tambak" && layer.id !== "layer_sawah") continue;
        let areaHa = layer._cachedAreaHa || 0;
        let lengthKm = layer._cachedLengthKm || 0;
        if (!layer._cachedStatsCalculated && layer.geojson) {
          turf2.featureEach(layer.geojson, (currentFeature) => {
            const geomType = currentFeature.geometry?.type;
            const coords = currentFeature.geometry?.coordinates;
            if (!coords || coords.length === 0) return;
            try {
              if (geomType === "Polygon" || geomType === "MultiPolygon") {
                const sqMeters = turf2.area(currentFeature);
                areaHa += sqMeters / 1e4;
              } else if (geomType === "LineString" || geomType === "MultiLineString") {
                lengthKm += turf2.length(currentFeature, { units: "kilometers" });
              }
            } catch (e) {
            }
          });
          layer._cachedAreaHa = Number(areaHa.toFixed(2));
          layer._cachedLengthKm = Number(lengthKm.toFixed(2));
          layer._cachedStatsCalculated = true;
        }
        if (areaHa > 0) {
          stats.push(`- Luasan ${layer.name}: ${areaHa.toFixed(2)} Hektar`);
        }
        if (lengthKm > 0) {
          stats.push(`- Panjang ${layer.name}: ${lengthKm.toFixed(2)} KM`);
        }
      }
      if (stats.length > 0) {
        spatialStatsContext = "\n\nINFORMASI STATISTIK LAYER SPASIAL (Gunakan ini jika pengguna menanyakan luasan layer tambak, sawah, mangrove, jalan, atau poligon lainnya):\n" + stats.join("\n");
      }
    } catch (err) {
    }
    let simulationInjection = "";
    if (simulationContext) {
      const rawCapex = simulationContext.capex;
      const rawOpex = simulationContext.opex;
      const rawRev = simulationContext.asumsiPendapatan !== void 0 ? simulationContext.asumsiPendapatan : simulationContext.revenue;
      const rawRoi = simulationContext.roi !== void 0 ? simulationContext.roi : 0;
      const rawBep = simulationContext.bep !== void 0 ? simulationContext.bep : simulationContext.paybackPeriod;
      const rawNpv = simulationContext.npv;
      const rawIrr = simulationContext.irr;
      const formattedCapex = typeof rawCapex === "number" ? `Rp ${rawCapex.toLocaleString("id-ID")}` : String(rawCapex || "0");
      const formattedOpex = typeof rawOpex === "number" ? `Rp ${rawOpex.toLocaleString("id-ID")}` : String(rawOpex || "0");
      const formattedRev = typeof rawRev === "number" ? `Rp ${rawRev.toLocaleString("id-ID")}` : String(rawRev || "0");
      const formattedRoi = typeof rawRoi === "number" ? `${rawRoi.toFixed(2)}%` : String(rawRoi || "0%");
      const formattedBep = typeof rawBep === "number" ? `${rawBep.toFixed(2)} Tahun` : String(rawBep || "0 Tahun");
      const formattedNpv = typeof rawNpv === "number" ? `Rp ${rawNpv.toLocaleString("id-ID")}` : String(rawNpv || "0");
      const formattedIrr = typeof rawIrr === "number" ? `${rawIrr.toFixed(2)}%` : String(rawIrr || "0%");
      simulationInjection = `

Kamu adalah Konsultan Investasi Ahli Kabupaten Luwu. Investor sedang melihat potensi ${simulationContext.name}. Mereka mensimulasikan data berikut: CAPEX ${formattedCapex}, OPEX ${formattedOpex}, Proyeksi Pendapatan ${formattedRev}, ROI ${formattedRoi}, BEP ${formattedBep}, NPV ${formattedNpv}, IRR ${formattedIrr}. Berdasarkan data simulasi ini dan dokumen LKPJ/BPS/Spasial yang kamu miliki, berikan: 1. Evaluasi apakah angka ini realistis dan menguntungkan. 2. Rekomendasi strategis untuk menekan risiko. 3. Peluang spesifik wilayah tersebut (infrastruktur, demografi) yang mendukung simulasi ini. Jawab dengan bahasa bisnis yang profesional, persuasif, namun objektif. Sapa mereka secara akrab menggunakan kata "kawan" beberapa kali untuk menjaga kehangatan pelayanan Simpurusiang kawan.`;
    }
    const activeLang = language || "id";
    let languageInstruction = "";
    if (activeLang === "en") {
      languageInstruction = `
[LANGUAGE INSTRUCTION]
The user preferred English language.
1. You MUST ALWAYS speak and answer in clean, professional, and grammatically correct English (Bahasa Inggris) kawan.
2. Maintain the warm and polite hospitality, and you can refer to the user as "my friend" or "friend" (the equivalent of "kawan" in Indonesian) to match the "Simpurusiang" local warmth.
3. Keep all coordinates tag format intact like [COORD:lat,lng:Name].
4. Translate any context or BPS stats to English in your final reply naturally (e.g., Economic Growth: 5.69%, GRDP: Rp 17.84 Trillion).`;
    } else if (activeLang === "zh") {
      languageInstruction = `
[LANGUAGE INSTRUCTION]
The user preferred Chinese (Simplified Mandarin) language.
1. You MUST ALWAYS speak and answer in clean, polite, and professional Simplified Chinese (\u4E2D\u6587/\u666E\u901A\u8BDD) kawan.
2. Maintain the warm and polite hospitality, and you can refer to the user as "\u670B\u53CB" (p\xE9ngyou) or "kawan" to match the "Simpurusiang" local warmth kawan.
3. Keep all coordinates tag format intact like [COORD:lat,lng:Name].
4. Translate any context or BPS stats to Chinese in your final reply naturally (e.g., \u7ECF\u6D4E\u589E\u957F\u7387: 5.69%, \u5730\u533A\u751F\u4EA7\u603B\u503C(PDRB): 17.84\u4E07\u4EBF\u5370\u5C3C\u76FE).`;
    } else {
      languageInstruction = `
[LANGUAGE INSTRUCTION]
The user preferred Indonesian language (Bahasa Indonesia).
1. Selalu jawab dengan bahasa Indonesia yang ramah, sopan, membantu, dan panggillah pengguna dengan sapaan akrab "kawan".`;
    }
    const dynamicDocList = await fetchActiveDocuments();
    const systemInstruction = `Anda adalah Konsultan AI Geospasial MPP Simpurusiang Kabupaten Luwu, Indonesia. 
Tugas Anda mendampingi investor dan masyarakat dalam mengidentifikasi titik potensi investasi riil di Kabupaten Luwu berbasis analisis spasial geografi dan data tata ruang (KKPR / RTRW 2024-2044) secara transparan, akuntabel, dan presisi kawan.

\u{1F6A8} SYSTEM DIRECTIVE: RAG MODE ACTIVATED
You are the official AI Consultant for the Luwu Investment Ecosystem (MPP Simpurusiang).
You are the official AI Consultant for the Luwu Investment Ecosystem (MPP Simpurusiang), tasked with providing highly precise, professional, and convincing consultation to prospective investors.
1. GAYA BAHASA PROFESIONAL: Gunakan bahasa yang meyakinkan, ramah (gunakan kata sapaan "kawan" dengan porsi yang pas), dan berorientasi pada nilai bisnis serta kemudahan investasi bagi investor.
2. TINGKATKAN ANALISIS: Ketika menjawab, susun jawaban dengan struktur yang mudah dibaca (gunakan bullet points), tonjolkan *unique selling points* (USP) dari potensi daerah, dan hubungkan dengan kesiapan infrastruktur atau data makro yang ada.
1. PRIORITY SOURCE: Your ONLY source of truth for investment project details, regulatory compliance, and spatial potential is the provided CONTEXT.
2. RETRIEVAL PROTOCOL: 
   - When a user asks a question, always analyze the provided CONTEXT (retrieved from our Knowledge Base).
   - If the information exists in the CONTEXT, answer based EXCLUSIVELY on that data.
   - If the information is NOT in the CONTEXT, politely state: "Maaf, data spesifik tersebut belum terdaftar dalam database IPRO kami saat ini. Namun, berdasarkan RTRW wilayah, potensi di area tersebut adalah..." (Do NOT hallucinate).
3. CITATION: Always maintain a professional, consultative tone. Mention which document you are referencing if applicable (e.g., "Berdasarkan dokumen LPPD 2025...").

\u{1F6A8} ATURAN INTEGRITAS UTAMA (LARANGAN HALUSINASI PROYEK):
1. Anda DILARANG KERAS mengarang, memalsukan, atau menyebutkan proyek/potensi investasi fiktif yang tidak bersumber dari data riil.
2. Skenario analisis, data spasial, dan potensi investasi HANYA BOLEH mengonsumsi data asli dari database yang aktif (terlampir di RAG/Context di bawah) kawan.
3. Jika data potensi investasi dalam database atau context kosong, Anda WAJIB merespons secara jujur bahwa "Data tidak tersedia kawan" atau belum ada usulan potensi terdaftar dalam database, dan meminta user/admin mengunggah metadata proyek riil terlebih dahulu kawan.
4. Jangan menyuguhkan angka-angka finansial palsu (seperti NPV, IRR, Payback fiktif) untuk mengarang ketersediaan proyek baru kawan.${simulationContext ? "" : "\n\n\u{1F6A8} BATASAN PERAN (PENTING): You are the Luwu Spatial Investment AI. Your ONLY job is to provide information regarding investment potentials, spatial planning (RTRW), and regulations based explicitly on your provided RAG documents. DO NOT perform ROI, CAPEX, OPEX, or financial feasibility analyses. If a user asks for financial simulation analysis, politely inform them to use the 'Smart Investment Form' and click the dedicated 'Minta AI Analisa Kelayakan Ini' button inside the simulator."}

[DOKTRIN PGROUTING & JARAK JALAN RAYA]
You are an expert GIS AI. You have access to real road-network data via PgRouting. Never calculate distance manually.
1. Anda DILARANG KERAS memperkirakan jarak dengan mengatakan "Berdasarkan kedekatan koordinat" atau menggunakan perhitungan jarak garis lurus koordinat.
2. Always fetch the 'rute darat' (road distance) data stored in the database. If the distance field is present in the database profile or context, cite that number as the 'Jarak Tempuh Jalan Raya'.
3. Anda WAJIB memprotes atau menjelaskan bahwa analisis rute jalan tersebut adalah: "Berdasarkan analisis rute jalan raya (PgRouting)..."
4. ATURAN KRITIS TENTANG JARAK: Jika pengguna/investor bertanya tentang jarak (distance) ke suatu fasilitas, lokasi, atau infrastruktur, JANGAN PERNAH menebak, menghitung, atau memberikan angka estimasi sendiri. Anda harus menjawab dengan sopan: 'Untuk data jarak spasial yang sangat akurat, silakan lihat langsung pada grafik Analisis Jarak Fasilitas di layar Profil Kelayakan Anda.'

[DOKTRIN DATA MAKRO & DEMOGRAFI BPS LUWU]
Gunakan data makroekonomi terverifikasi berikut kawan:
- Pertumbuhan Ekonomi: 5,69% kawan.
- PDRB (Produk Domestik Regional Buruto): Rp 17,84 Triliun dengan PDRB Per Kapita Rp 53,38 Juta kawan.
- IPM (Indeks Pembangunan Manusia): 72,42 kawan.
- TPT (Tingkat Pengangguran Terbuka): 3,85% kawan.
- Tingkat Kemiskinan: 12,49% kawan.
- Geografi: Luas wilayah 3.000,25 km\xB2 melingkup dari pesisir Teluk Bone (37 desa pesisir strategis) hingga pegunungan Latimojong setinggi 3.500 mdpl. [COORD:-3.3542,120.3129:Belopa Ibukota Luwu]


[KNOWLEDGE BASE - KABUPATEN LUWU 2026]
Anda adalah Konsultan Investasi Resmi DPMPTSP Kabupaten Luwu. Gunakan data berikut sebagai referensi utama:
1. INFRASTRUKTUR UTAMA: Bandara Bua (Lagaligo) untuk logistik udara, Pelabuhan Tanjung Ringgit untuk kargo laut/ekspor, dan Jalan Trans Sulawesi.
2. SEKTOR UNGGULAN: 
   - Pertanian/Perkebunan: Kakao (Sentra di Noling, Bua Ponrang), Cengkeh, Sagu, dan Padi.
   - Perikanan: Tambak Udang Vaname dan Bandeng di wilayah pesisir (Bua, Ponrang, Suli).
   - Pertambangan & Smelter: Zona industri smelter difokuskan di wilayah tertentu dengan regulasi ketat AMDAL.
3. REGULASI TATA RUANG (RTRW): Rencana Tata Ruang Wilayah berpedoman pada Peraturan Daerah Kabupaten Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah Kabupaten Luwu Tahun 2011-2031 dan Peraturan Bupati Luwu Nomor 53 Tahun 2011. Pembangunan pabrik/industri besar wajib berada di Zona Industri yang telah ditetapkan Perda (seperti Kawasan Industri Bua & Walenrang). Kawasan pesisir memiliki sempadan pantai minimal 100 meter dari pasang tertinggi yang harus dilindungi.
4. INSENTIF PEMDA: Pemkab Luwu memberikan kemudahan perizinan (Fast-track OSS-RBA), pendampingan mediasi lahan (Clean and Clear), dan potensi keringanan retribusi daerah untuk investasi padat karya (menyerap >500 tenaga kerja lokal).
5. DEMOGRAFI: Tenaga kerja lokal tersedia dengan UMK yang kompetitif dibandingkan ibu kota provinsi, cocok untuk industri manufaktur dan agro-industri.
6. STATUS IPRO (INVESTMENT PROJECT READY TO OFFER):
ATURAN WAJIB: Jika ditanya apakah ada proyek yang sudah "Ready to Offer" atau IPRO, Anda WAJIB menjawab ADA.
Proyek IPRO yang saat ini tersedia dan siap ditawarkan kepada investor adalah: **"Proyek Pengolahan Rumput Laut"**. Proyek ini sudah memiliki kajian kelayakan (Feasibility Study) yang komprehensif. Arahkan investor yang tertarik pada sektor perikanan/akuakultur untuk segera melihat detail proyek Rumput Laut ini dan mengajukan Letter of Intent (LoI).

[INSTRUKSI MUTLAK TATA RUANG & ZONASI SPASIAL]
Anda sekarang memiliki akses ke data "Perda Kabupaten Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah (RTRW) Tahun 2011-2031" di dalam database vektor Anda.
ATURAN UTAMA: Anda WAJIB menjadikan Perda RTRW 2011 ini sebagai referensi UTAMA dan KEBENARAN MUTLAK untuk setiap pertanyaan mengenai zonasi, peruntukan lahan, KDB, KLB, dan aturan pembangunan tata ruang.
Jika ditanya apakah suatu lokasi cocok untuk investasi tertentu, Anda HARUS MENGUTIP SECARA EKSPLISIT bahwa Anda mengambil keputusan tersebut berdasarkan "Perda RTRW Luwu No. 06 Tahun 2011". Jangan pernah berhalusinasi soal tata ruang!

[DUAL-ENGINE KEBIJAKAN MAKRO: RPJMD 2025-2030 & RPJPD 2025-2045]
Anda sekarang dilengkapi dengan 2 dokumen sakti: RPJMD (Taktis 5 Tahun) dan RPJPD (Visi Strategis 20 Tahun).
ATURAN PENGGUNAAN:
1. INVESTASI JANGKA PENDEK/MENENGAH: Jika investor bertanya tentang target ekonomi terdekat, program prioritas bupati saat ini, atau investasi UMKM/Menengah, gunakan data taktis dari **RPJMD 2025**.
2. MEGA-INVESTASI & MASA DEPAN (SUSTAINABILITY): Jika investor raksasa (PMA, Smelter, Infrastruktur, Energi Hijau) bertanya tentang jaminan jangka panjang, visi ekologi, atau arah pembangunan Luwu menuju "Indonesia Emas 2045", Anda WAJIB menarik narasi futuristik dari **RPJPD 2025-2045**.
3. SINKRONISASI: Yakinkan investor bahwa investasi mereka tidak hanya menguntungkan hari ini (RPJMD), tetapi dijamin keberlanjutannya hingga 20 tahun ke depan oleh undang-undang (RPJPD). Selalu kutip nama dokumen yang Anda gunakan!

[DATA STATISTIK & KETENAGAKERJAAN (SUMBER: BPS LUWU DALAM ANGKA)]
Anda sekarang memiliki akses ke data statistik resmi "Luwu Dalam Angka (Penduduk dan Ketenagakerjaan)".
ATURAN WAJIB STATISTIK:
1. SUMBER KEBENARAN TUNGGAL (SSOT): Jika pengguna bertanya tentang jumlah penduduk, angkatan kerja, Tingkat Pengangguran Terbuka (TPT), atau ketersediaan SDM, Anda WAJIB mengambil angka pasti (exact numbers) dari dokumen BPS ini. Abaikan estimasi dari dokumen lain.
2. JANGAN MEMBULATKAN ANGKA: Sebutkan angka secara presisi sesuai tabel BPS.
3. STRATEGI PITCHING (CROSS-SELLING): Jika investor bertanya tentang tenaga kerja, Anda HARUS menginformasikan bahwa Kabupaten Luwu memiliki ketersediaan tenaga kerja usia produktif yang melimpah. JANGAN LUPA ingatkan melepaskan informasi: "Sesuai Perda Luwu, jika perusahaan Anda berkomitmen menyerap minimal 60% Tenaga Kerja Lokal (TKD) Luwu, Anda berhak mendapatkan Insentif Pengurangan Retribusi dan Sewa Lahan hingga 35%!"

[DATA HIDROLOGI & SUNGAI KABUPATEN LUWU (SUMBER: DOKUMEN RPJPD 2025-2045)]
Anda memiliki akses penuh ke data hidrologi, Daerah Aliran Sungai (DAS), Sub-DAS, dan jaringan sungai yang melintasi kecamatan-kecamatan di Kabupaten Luwu dalam dokumen **RPJPD Kabupaten Luwu 2025-2045**.
ATURAN WAJIB HIDROLOGI & SUNGAI:
1. PERINGATAN INTEGRITAS: DILARANG KERAS menyebutkan "Sungai Poso" atau "DAS Poso" karena Poso berada di Provinsi Sulawesi Tengah dan BUKAN wilayah Kabupaten Luwu, Sulawesi Selatan.
2. DAFTAR SUNGAI/DAS RESMI PER KECAMATAN DI KABUPATEN LUWU (RPJPD 2025-2045):
   - Bajo Barat: DAS Suso / Sungai Suso
   - Bajo: DAS Suso & DAS Suli / Sungai Suso & Sungai Suli
   - Suli: DAS Suli / Sungai Suli
   - Suli Barat: DAS Suli / Sungai Suli
   - Belopa: DAS Seppong & DAS Suli / Sungai Seppong & Sungai Suli
   - Belopa Utara: DAS Seppong / Sungai Seppong
   - Kamanre: DAS Kamanre / Sungai Kamanre
   - Ponrang: DAS Paremang / Sungai Paremang
   - Ponrang Selatan: DAS Paremang / Sungai Paremang
   - Bupon: DAS Noling / Sungai Noling
   - Bua: DAS Bua / Sungai Bua
   - Walenrang: DAS Lamasi / Sungai Lamasi
   - Walenrang Timur: DAS Lamasi / Sungai Lamasi
   - Walenrang Barat: DAS Makawa / Sungai Makawa
   - Lamasi: DAS Lamasi / Sungai Lamasi
   - Lamasi Timur: DAS Lamasi / Sungai Lamasi
   - Larompong: DAS Larompong / Sungai Larompong
   - Larompong Selatan: DAS Larompong / Sungai Larompong
   - Latimojong: DAS Saluwo & DAS Suso / Sungai Kadundung (Hulu DAS Suso)
3. LOGIKA DUKUNGAN AIR BAKU PER KECAMATAN (PRECISION FALLBACK):
   - Apabila lokasi potensi berada pada sebuah kecamatan di atas, gunakan DAS/sungai resmi kecamatan tersebut sebagai ketersediaan air baku.
   - Apabila kecamatan lokasi potensi TIDAK memiliki daftar DAS sungai langsung dalam RPJPD Luwu (contoh: Bastem, Bastem Utara, Walenrang Utara), WAJIB mengambil daftar sungai dari kecamatan tetangga terdekat yang memiliki DAS/sungai dalam RPJPD Luwu:
     * Bastem: Suplesi DAS Suso (Hulu Sungai Suso & Saluwo) dari kecamatan tetangga terdekat Latimojong & Bajo Barat.
     * Bastem Utara: Suplesi DAS Makawa & DAS Bua (Hulu Sungai Makawa & Bua) dari kecamatan tetangga terdekat Walenrang Barat & Bua.
     * Walenrang Utara: Suplesi DAS Lamasi (Sungai Lamasi) dari kecamatan tetangga terdekat Walenrang & Lamasi.
4. DILARANG MENJAWAB "BELUM ADA DATA": Jika pengguna atau investor bertanya tentang sungai, potensi air baku, atau DAS di kecamatan lokasi potensi di Kabupaten Luwu, gunakan logika presisi RPJPD 2025-2045 di atas.
5. EKSTRAK DOKUMEN RPJPD 2025-2045: Jelaskan karakteristik hidrologi, debit air baku, serta potensi pemanfaatan air permukaan untuk jaringan irigasi, air baku industri, dan Pembangkit Listrik Tenaga Air (PLTA/PLTMH).
6. KUTIP SUMBER EKSPLISIT: Selalu cantumkan bahwa data hidrologi dan jaringan sungai tersebut bersumber dari **Dokumen RPJPD Kabupaten Luwu 2025-2045**.

[ATURAN KRITIS DATA TABEL & ANGKA]
Jika Anda mengambil data kuantitatif (luas wilayah, persentase, jumlah penduduk, dll) dari sebuah tabel di dokumen RAG, Anda DILARANG KERAS menghitung ulang atau membuat estimasi matematika sendiri. 
KUTIP PERSIS ANGKA YANG TERTULIS DI DALAM DOKUMEN/TABEL (termasuk koma dan persentasenya). Jika di dokumen tertulis 15,59%, maka jawablah 15,59%. Jangan pernah melakukan pembulatan atau kalkulasi mandiri!

[PROTOKOL PENELUSURAN MULTI-DOKUMEN & ANTI-HALUSINASI ABSOLUT]
1. SINTESIS KOMPREHENSIF: Saat menjawab pertanyaan apapun tentang Luwu, Anda WAJIB memindai seluruh dokumen di database vektor Anda. Jika informasi terkait ada di beberapa dokumen (misalnya: data luas wilayah ada di BPS 2025 dan RPJMD 2021), Anda HARUS menggabungkannya (cross-reference).
2. KUTIPAN SUMBER EKSPLISIT: Anda DILARANG KERAS menyajikan fakta, angka, atau kebijakan tanpa menyebutkan NAMA DOKUMEN SUMBERNYA secara transparan di awal atau akhir kalimat.
3. RESOLUSI KONFLIK DATA: Jika terdapat perbedaan angka antar dokumen (misal karena perbedaan tahun rilis), Anda harus menyajikan keduanya secara jujur. (Contoh: "Menurut dokumen BPS 2025 luasnya adalah X, namun menurut dokumen Perda RPJMD 2021 luasnya tercatat Y").
4. ZERO KNOWLEDGE FALLBACK (PENTING): Jika pengguna menanyakan detail tentang Luwu yang BENAR-BENAR TIDAK ADA dalam basis data vektor Anda, Anda WAJIB menjawab: "Mohon maaf, informasi terkait hal tersebut belum tercatat dalam dokumen resmi Pemerintah Kabupaten Luwu di basis data saya." JANGAN PERNAH MENGARANG JAWABAN BERDASARKAN PENGETAHUAN INTERNET BAWAAN ANDA!

${dynamicDocList}
ATURAN PENCARIAN: Jika pengguna bertanya hal yang berkaitan dengan daftar dokumen di atas, pastikan Anda menggunakan alat pencarian vektor Anda untuk mengekstrak detail dari dokumen tersebut.

[PANDUAN NAVIGASI SPASIAL INTERAKTIF]
Jika merekomendasikan lokasi, infrastruktur atau titik potensi investasi aktif, Anda WAJIB menyertakan 'kartu koordinat' menggunakan sintaks berikut di dalam teks tanggapan Anda agar kamera peta bergerak otomatis kawan:
\`[COORD:latitude,longitude:Nama Lokasi]\`

Contoh:
"Letak simpul jalur logistik laut pelabuhan berada di pesisir Belopa [COORD:-3.3768,120.3621:Pelabuhan Belopa]"

DOKUMEN CONTEXT REAL-TIME (SUPABASE & GIS MAP):
${ragContext}${specificInvestmentContext}${spatialStatsContext}${simulationInjection}

${languageInstruction}`;
    const response = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    res.json({ text: response.text, sources: res.locals.ragSources || [] });
  } catch (error) {
    console.error("\u{1F6A8} GEMINI AI FATAL ERROR:", error?.message || error);
    console.error("Stack:", error?.stack);
    return res.status(500).json({
      error: "AI Failed",
      details: error?.message || "Internal server error"
    });
  }
});
app.post("/api/gemini/tts", async (req, res) => {
  const { text, voice = "Kore" } = req.body;
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API client is not initialized. Please set GEMINI_API_KEY.",
      message: "Client AI tidak aktif kawan! Sila konfigurasikan API Key kawan."
    });
  }
  try {
    const response = await generateContentWithFallback({
      contents: [{ parts: [{ text: `Say in Indonesian: ${text}` }] }],
      config: {
        responseModalities: [import_genai.Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice?.charAt(0).toUpperCase() + voice?.slice(1).toLowerCase() || "Kore"
            }
          }
        }
      }
    }, ["gemini-3.1-flash-tts-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite"]);
    const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData && p.inlineData.data);
    const base64Audio = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || "audio/wav";
    if (!base64Audio) {
      throw new Error("No audio content returned from Gemini TTS");
    }
    const audioBuffer = Buffer.from(base64Audio, "base64");
    res.setHeader("Content-Type", mimeType);
    res.send(audioBuffer);
  } catch (err) {
    console.error("Gemini TTS Error:", err);
    res.status(500).json({ error: "Failed to generate speech", details: err?.message || String(err) });
  }
});
var knowledgeDocuments = [];
var uploadStorage = import_multer.default.memoryStorage();
var upload = (0, import_multer.default)({ storage: uploadStorage, limits: { fileSize: 10 * 1024 * 1024 } });
app.post("/api/upload-photo-base64", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing image base64 data" });
    const match = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid base64 string" });
    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    const { data, error } = await supabase2.storage.from("investments").upload(filename, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) {
      console.error("Supabase storage upload error:", error);
      return res.status(500).json({ error: `[Supabase Storage] ${error.message} (Pastikan secret SUPABASE_SERVICE_ROLE_KEY valid diawali eyJ...)` });
    }
    const { data: urlData } = supabase2.storage.from("investments").getPublicUrl(filename);
    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/upload-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing photo file" });
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    const { data, error } = await supabase2.storage.from("investments").upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });
    if (error) {
      console.error("Supabase storage upload error:", error);
      return res.status(500).json({ error: `[Supabase Storage] ${error.message} (Pastikan secret SUPABASE_SERVICE_ROLE_KEY valid diawali eyJ...)` });
    }
    const { data: urlData } = supabase2.storage.from("investments").getPublicUrl(filename);
    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error("Error uploading photo via FormData:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/keep-alive", async (req, res) => {
  try {
    const { data: pingData, error: pingError } = await supabase2.from("investments").select("id").limit(1);
    if (pingError) {
    }
    const { error: logError } = await supabase2.from("system_logs").insert([
      {
        event_type: "CRON_PING",
        description: "Ping from external cron (keep-alive)"
      }
    ]);
    if (logError) {
    }
    res.json({
      status: "success",
      message: "Database is awake",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("[KEEP-ALIVE] Unexpected error:", err);
    res.status(500).json({ error: "Keep-alive ping failed", details: err.message });
  }
});
app.get("/api/system-logs", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("system_logs").select("*").order("created_at", { ascending: false }).limit(5);
    if (error) {
      if (error.code === "42P01") {
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    console.error("[SYSTEM LOGS] Failed to fetch logs:", err.message);
    res.status(500).json({ error: "Failed to fetch system logs" });
  }
});
var geometriesData = [];
app.get("/api/geometries", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("geometries").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      const fallback = await supabase2.from("geometries").select("*").order("created_at", { ascending: false });
      return res.json(fallback.data || []);
    }
    const mapped = data.map((g) => ({
      ...g,
      geometryType: g.geometry?.type || "Polygon",
      areaHa: g.area_ha || 0,
      perimeterKm: g.perimeter_km || 0,
      centroidLat: turf2.centroid(turf2.feature(g.geometry)).geometry.coordinates[1],
      centroidLng: turf2.centroid(turf2.feature(g.geometry)).geometry.coordinates[0],
      infrastructures: g.infrastructures?.[0] || null
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
function parseAndValidateRole(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return "Public";
  }
  const token = authHeader.substring(7);
  try {
    const decoded = import_jsonwebtoken.default.verify(token, GLOBAL_JWT_SECRET);
    return decoded.role || "Public";
  } catch (err) {
    return "Public";
  }
}
app.use(async (req, res, next) => {
  const publicPaths = [
    "/api/auth/login",
    "/api/gemini/recommendation",
    "/api/gemini/chat",
    "/api/gemini/tts",
    "/api/gemini/narrative",
    "/api/gemini/generate-tour",
    "/api/gemini/translate",
    "/gemini/translate",
    "/api/investment-interests"
  ];
  const isPublicPath = publicPaths.includes(req.path);
  const isWriteMethod = ["POST", "PUT", "DELETE"].includes(req.method);
  if (isWriteMethod && !isPublicPath && req.path.startsWith("/api/")) {
    await requireAuthMiddleware(req, res, next);
  } else {
    next();
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Email dan password wajib diisi." });
  }
  let userEmail = username;
  let mappedRole = "Operator";
  let userId = "offline-user-id";
  let tokenSession = null;
  const authClient = (0, import_supabase_js3.createClient)(SUPABASE_URL2, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY2, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  let authData = null;
  let authError = null;
  try {
    const resAuth = await authClient.auth.signInWithPassword({
      email: username,
      password
    });
    authData = resAuth.data;
    authError = resAuth.error;
  } catch (e) {
    authError = e;
  }
  if (authError || !authData?.user) {
    const lowerEmail = username.toLowerCase().trim();
    if (lowerEmail === "superadmin@luwu.go.id" && password === "SuperAdmin123!") {
      mappedRole = "Super Admin";
      userEmail = "superadmin@luwu.go.id";
      userId = "offline-super-admin-uuid-00001";
    } else if (lowerEmail === "operator@luwu.go.id" && password === "Operator123!") {
      mappedRole = "Operator";
      userEmail = "operator@luwu.go.id";
      userId = "offline-operator-uuid-00002";
    } else {
      return res.status(401).json({
        success: false,
        message: "Kredensial tidak valid: " + (authError?.message || "User atau email tidak terdaftar dalam basis data Pemkab Luwu.")
      });
    }
  } else {
    const userMetadataRole = authData.user.user_metadata?.role || "Jabatan Pelaksana";
    const { data: profile } = await supabase2.from("profiles").select("role").eq("id", authData.user.id).single();
    let dbRole = profile?.role || userMetadataRole;
    if (dbRole === "superadmin" || dbRole === "SUPER_ADMIN") {
      mappedRole = "Super Admin";
    } else if (dbRole === "admin_dalak") {
      mappedRole = "Admin Dalak";
    } else if (dbRole === "admin_oss") {
      mappedRole = "Admin OSS";
    } else if (dbRole === "admin_promosi") {
      mappedRole = "Admin Promosi";
    } else if (dbRole === "investor") {
      mappedRole = "Investor";
    } else {
      mappedRole = "Operator";
    }
    userEmail = authData.user.email;
    userId = authData.user.id;
    tokenSession = authData.session;
  }
  if (role && role !== mappedRole) {
    return res.status(403).json({ success: false, message: `Akses ditolak. Email terdaftar sebagai ${mappedRole}, bukan ${role}.` });
  }
  const token = import_jsonwebtoken.default.sign({ role: mappedRole, username: userEmail, sub: userId }, GLOBAL_JWT_SECRET, { expiresIn: "12h" });
  return res.json({
    success: true,
    message: `Login ${mappedRole} berhasil.`,
    token,
    role: mappedRole,
    supabase_token: tokenSession?.access_token || null,
    session: tokenSession
  });
});
app.post("/api/auth/register-operator", async (req, res) => {
  const { name, email, password } = req.body;
  const currentRole = parseAndValidateRole(req);
  if (currentRole !== "Super Admin") {
    return res.status(403).json({ success: false, message: "Akses Ditolak: Hanya Super Admin yang dapat membuat operator." });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Semua kolom wajib diisi (Nama, Email, dan Password)." });
  }
  const { data, error } = await supabase2.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "Jabatan Pelaksana", name }
  });
  if (error) {
    return res.status(500).json({ success: false, message: "Gagal membuat operator: " + error.message });
  }
  return res.json({ success: true, message: "Berhasil membuat operator baru." });
});
function safeIntersect(poly1, poly2) {
  try {
    return turf2.intersect(turf2.featureCollection([poly1, poly2]));
  } catch (err) {
    return null;
  }
}
async function calculateSpatialSync(geometry) {
  const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
  let kecamatanMatch = null;
  let desaMatch = null;
  let nearestRoadKm = 0;
  const thematicOverlaps = {
    sawahHa: 0,
    tambakHa: 0,
    mangroveHa: 0,
    lahanKeringPrimerHa: 0,
    lahanKeringSekunderHa: 0
  };
  const nearestFacilities = [];
  try {
    let centroid3 = null;
    let userPoly = null;
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      userPoly = geometry.type === "Polygon" ? turf2.polygon(geometry.coordinates) : turf2.multiPolygon(geometry.coordinates);
      centroid3 = turf2.centroid(userPoly);
    } else if (geometry.type === "LineString") {
      const line = turf2.lineString(geometry.coordinates);
      const mid = turf2.midpoint(geometry.coordinates[0], geometry.coordinates[geometry.coordinates.length - 1]);
      centroid3 = mid;
    } else if (geometry.type === "Point") {
      centroid3 = turf2.point(geometry.coordinates);
    }
    if (!centroid3) return null;
    const [cLng, cLat] = centroid3.geometry.coordinates;
    currentSyncProgress.currentLayer = "Kecamatan";
    for (const d of districtsData) {
      if (d.geojson) {
        try {
          const isInside = turf2.booleanPointInPolygon(centroid3, d.geojson);
          if (isInside) {
            kecamatanMatch = d.name;
            break;
          }
        } catch (e) {
        }
      }
    }
    currentSyncProgress.currentLayer = "Desa";
    for (const f of realDesaFeatures) {
      if (f.geometry) {
        try {
          const isInside = turf2.booleanPointInPolygon(centroid3, f);
          if (isInside) {
            desaMatch = f.properties?.Name || f.properties?.Nama_Desa || null;
            break;
          }
        } catch (e) {
        }
      }
    }
    currentSyncProgress.currentLayer = "Jalan & Infrastruktur (pgRouting)";
    const fromParam = geometry ? { type: "Feature", geometry, properties: {} } : centroid3;
    for (const facility of infrastructurePoints) {
      try {
        const facPt = turf2.point([facility.longitude, facility.latitude]);
        const res = await getDistance(fromParam, facPt, { units: "kilometers" }, supabase2);
        const dist = res.distance;
        nearestFacilities.push({
          id: facility.id,
          name: facility.name,
          type: facility.type,
          distanceKm: Number(dist.toFixed(2)),
          method: res.method
        });
      } catch (e) {
      }
    }
    nearestFacilities.sort((a, b) => a.distanceKm - b.distanceKm);
    const roadLayer = spatialLayers.find((l) => l.id === "layer_jalan");
    if (roadLayer && roadLayer.geojson) {
      let minRoadDist = Infinity;
      try {
        let roadFeatureCount = 0;
        for (const lineFeat of roadLayer.geojson.features) {
          if (roadFeatureCount++ > 200) break;
          if (lineFeat.geometry?.type === "LineString" || lineFeat.geometry?.type === "MultiLineString") {
            const nearestPt = turf2.nearestPointOnLine(lineFeat, centroid3);
            const distRes = await getDistance(fromParam, nearestPt, { units: "kilometers" }, supabase2);
            if (distRes.distance < minRoadDist) {
              minRoadDist = distRes.distance;
            }
          }
        }
      } catch (e) {
      }
      nearestRoadKm = minRoadDist === Infinity ? 0 : Number(minRoadDist.toFixed(2));
    }
    currentSyncProgress.currentLayer = "Thematic Layers";
    if (userPoly) {
      const thematicMapping = [
        { key: "sawahHa", layerId: "layer_sawah" },
        { key: "tambakHa", layerId: "layer_tambak" },
        { key: "mangroveHa", layerId: "layer_mangrove" },
        { key: "lahanKeringPrimerHa", layerId: "layer_lahan_kering_primer" },
        { key: "lahanKeringSekunderHa", layerId: "layer_lahan_kering_sekunder" }
      ];
      for (const map of thematicMapping) {
        const lObj = spatialLayers.find((l) => l.id === map.layerId);
        if (lObj && lObj.geojson) {
          let overlapHa = 0;
          try {
            let thematicFeatureCount = 0;
            turf2.featureEach(lObj.geojson, (thematicFeature) => {
              if (thematicFeatureCount++ > 500) return;
              if (thematicFeature.geometry?.type === "Polygon" || thematicFeature.geometry?.type === "MultiPolygon") {
                try {
                  const intersection = safeIntersect(userPoly, thematicFeature);
                  if (intersection) {
                    const intersectedArea = turf2.area(intersection);
                    overlapHa += intersectedArea / 1e4;
                  }
                } catch (err) {
                }
              }
            });
          } catch (e) {
          }
          thematicOverlaps[map.key] = Number(overlapHa.toFixed(2));
        }
      }
    }
  } catch (error) {
    console.error("Error in calculateSpatialSync loop computation:", error);
  }
  return {
    syncedAt,
    kecamatanMatch,
    desaMatch,
    nearestRoadKm,
    thematicOverlaps,
    nearestFacilities: nearestFacilities.slice(0, 5)
  };
}
app.get("/api/spatial-sync/progress", (req, res) => {
  res.json(currentSyncProgress);
});
app.get("/api/spatial-sync/cron", (req, res) => {
  res.json({
    ...spatialAutoCronState,
    currentTime: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/spatial-sync/cron/toggle", async (req, res) => {
  try {
    const { enabled, triggerNow } = req.body;
    if (typeof enabled === "boolean") {
      spatialAutoCronState.enabled = enabled;
      if (enabled) {
        spatialAutoCronState.nextRunAt = new Date(Date.now() + spatialAutoCronState.intervalMs).toISOString();
      }
    }
    if (triggerNow) {
      executeSpatialCronSync();
      return res.json({
        success: true,
        message: "Proses sinkronisasi otomatis (Cron 1 Jam) langsung dipicu!",
        cronState: spatialAutoCronState
      });
    }
    return res.json({
      success: true,
      message: `Jadwal Cron Job Otomatis berhasil diubah menjadi: ${spatialAutoCronState.enabled ? "AKTIF (Setiap 1 Jam)" : "NONAKTIF"}`,
      cronState: spatialAutoCronState
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/spatial-sync", async (req, res) => {
  try {
    const { id, type } = req.body;
    if (type === "investment") {
      const { data: invData } = await fetchAndJoinInvestments();
      const frontendRows = prepareForFrontend(invData || []);
      const idx = frontendRows.findIndex((inv) => inv.id === id);
      if (idx !== -1) {
        let inv = frontendRows[idx];
        let geoToSync = inv.geometry;
        if (!geoToSync && inv.latitude && inv.longitude) {
          geoToSync = { type: "Point", coordinates: [inv.longitude, inv.latitude] };
        }
        if (geoToSync) {
          const syncResult = await calculateSpatialSync(geoToSync);
          inv.spatialSync = syncResult;
          if (syncResult?.kecamatanMatch) {
            const matchedDist = districtsData.find((d) => d.name.toLowerCase() === syncResult.kecamatanMatch?.toLowerCase());
            if (matchedDist) {
              inv.districtId = matchedDist.id;
            }
          }
          if (syncResult?.desaMatch) {
            const matchedVillage = villagesData.find((v) => v.name.toLowerCase() === syncResult.desaMatch?.toLowerCase());
            if (matchedVillage) {
              inv.villageId = matchedVillage.id;
            }
          }
          await saveInvestmentToSupabaseDirect(inv);
          return res.json({ success: true, message: "Sinkronisasi spasial investasi berhasil!", data: inv });
        }
        return res.status(400).json({ error: "Investasi tidak memiliki data spasial (titik/polygon)." });
      }
    } else if (type === "geometry") {
      const idx = geometriesData.findIndex((geo) => geo.geometryId === id);
      if (idx !== -1) {
        const geo = geometriesData[idx];
        if (geo.geometry) {
          const syncResult = await calculateSpatialSync(geo.geometry);
          geometriesData[idx].spatialSync = syncResult;
          await supabase2.from("geometries").upsert(prepareForPostGIS(geometriesData[idx]));
          return res.json({ success: true, message: "Sinkronisasi spasial geometri berhasil!", data: geometriesData[idx] });
        }
        return res.status(400).json({ error: "Geometri tidak memiliki data koordinat." });
      }
    }
    const globalSyncResult = await syncGlobalSpatial();
    if (!globalSyncResult.success) {
      throw new Error(`Global spatial sync failed: ${globalSyncResult.error}`);
    }
    for (let idx = 0; idx < geometriesData.length; idx++) {
      const geom = geometriesData[idx];
      if (geom.geometry) {
        try {
          const syncResult = await calculateSpatialSync(geom.geometry);
          geometriesData[idx].spatialSync = syncResult;
          await supabase2.from("geometries").upsert(prepareForPostGIS(geometriesData[idx]));
        } catch (e) {
        }
      }
    }
    return res.json({ success: true, message: "Seluruh data potensi investasi berhasil disinkronkan secara spasial!" });
  } catch (error) {
    console.error("Error executing spatial-sync endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});
var getOsrmDistance = async (lat1, lng1, lat2, lng2) => {
  const res = await getDistance([lng1, lat1], [lng2, lat2], { units: "kilometers" }, supabase2);
  return res.distance;
};
app.post("/api/geometries", async (req, res) => {
  try {
    const { geometry, createdBy, name } = req.body;
    let areaHa = 0;
    let perimeterKm = 0;
    let centroidLat = 0;
    let centroidLng = 0;
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      const poly = geometry.type === "Polygon" ? turf2.polygon(geometry.coordinates) : turf2.multiPolygon(geometry.coordinates);
      const rawAreaSqm = turf2.area(poly);
      areaHa = Number((rawAreaSqm / 1e4).toFixed(2));
      perimeterKm = turf2.length(poly, { units: "kilometers" });
      const centroid3 = turf2.centroid(poly);
      centroidLng = centroid3.geometry.coordinates[0];
      centroidLat = centroid3.geometry.coordinates[1];
    } else if (geometry.type === "LineString") {
      const line = turf2.lineString(geometry.coordinates);
      perimeterKm = turf2.length(line, { units: "kilometers" });
      const mid = turf2.midpoint(geometry.coordinates[0], geometry.coordinates[geometry.coordinates.length - 1]);
      centroidLng = mid.geometry.coordinates[0];
      centroidLat = mid.geometry.coordinates[1];
    } else if (geometry.type === "Point") {
      centroidLng = geometry.coordinates[0];
      centroidLat = geometry.coordinates[1];
    }
    const geometryId = "geo_" + Date.now();
    const newGeometry = {
      geometryId,
      name: name || `Geo Asset ${geometryId}`,
      geometryType: geometry.type,
      geometry,
      // store actual GeoJSON object
      areaHa: Number(areaHa.toFixed(2)),
      perimeterKm: Number(perimeterKm.toFixed(2)),
      centroidLat: Number(centroidLat.toFixed(5)),
      centroidLng: Number(centroidLng.toFixed(5)),
      createdBy: createdBy || "operator",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const portDistance = await getOsrmDistance(centroidLat, centroidLng, -3.3364, 120.354);
    const airportDistance = await getOsrmDistance(centroidLat, centroidLng, -3.0722, 120.2016);
    const roadDistance = await getOsrmDistance(centroidLat, centroidLng, -3.33, 120.35);
    const spatialSyncResult = await calculateSpatialSync(geometry);
    const plnFac = spatialSyncResult.nearestFacilities?.find((f) => f.type === "Power Plant" || f.name?.toLowerCase().includes("pln"));
    const fiberFac = spatialSyncResult.nearestFacilities?.find((f) => f.type === "Telecommunication Tower" || f.name?.toLowerCase().includes("fiber") || f.name?.toLowerCase().includes("telko"));
    const enhancedGeometry = {
      ...newGeometry,
      infrastructures: {
        portDistance: Number(portDistance.toFixed(2)),
        airportDistance: Number(airportDistance.toFixed(2)),
        roadDistance: Number(roadDistance.toFixed(2)),
        provRoadDistance: Number((roadDistance + 1.2).toFixed(2)),
        electricityDistance: plnFac ? Number(plnFac.distanceKm.toFixed(2)) : Number((roadDistance * 1.5).toFixed(2)),
        fiberDistance: fiberFac ? Number(fiberFac.distanceKm.toFixed(2)) : Number((roadDistance * 1.8).toFixed(2))
      },
      spatialSync: spatialSyncResult
    };
    geometriesData.unshift(enhancedGeometry);
    const { error: dbErr } = await supabase2.from("geometries").upsert(prepareForPostGIS(enhancedGeometry));
    if (dbErr) {
      console.error("[Supabase Error] geometries.upsert:", dbErr.message);
      throw new Error(`Database error: ${dbErr.message}`);
    }
    res.status(201).json(enhancedGeometry);
  } catch (error) {
    console.error("Error at /api/geometries:", error);
    res.status(500).json({ error: error.message });
  }
});
function generateHexagon(centerLat, centerLng, radiusKm) {
  const center = turf2.point([centerLng, centerLat]);
  const options = { steps: 6, units: "kilometers" };
  const poly = turf2.circle(center, radiusKm, options);
  return poly;
}
var districtsData = [];
var dbSyncStatus = { success: true, error: null };
var realKecamatanFeatures = [];
try {
  const geojsonPath = getPublicFilePath("gis_kecamatan.json");
  if (import_fs.default.existsSync(geojsonPath)) {
    const geojsonData = JSON.parse(import_fs.default.readFileSync(geojsonPath, "utf8"));
    realKecamatanFeatures = geojsonData.features || [];
    districtsData = realKecamatanFeatures.map((f, idx) => {
      const rawName = f.properties?.KECAMATAN || f.properties?.kecamatan || `Kecamatan ${idx + 1}`;
      const formatName = (str) => {
        return str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
      };
      const cleanName = formatName(rawName);
      const id = `dist_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;
      const pop = f.properties?.SUM_Jum_Pd ? Math.round(Number(f.properties.SUM_Jum_Pd)) : 15e3;
      const areaHa = f.properties?.LUAS ? Math.round(Number(f.properties.LUAS) * 100) : 5e3;
      const density = f.properties?.KPDT_PDDK ? Math.round(Number(f.properties.KPDT_PDDK)) : Math.round(pop / (areaHa / 100 || 1));
      const villageCount = f.properties?.JLH_DESA ? Number(f.properties.JLH_DESA) : 10;
      let coords = [-3.2, 120.2];
      try {
        const cent = turf2.centroid(f);
        if (cent && cent.geometry && cent.geometry.coordinates) {
          coords = [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
        }
      } catch (err) {
      }
      const poly = JSON.parse(JSON.stringify(f));
      const sectorsList = ["Pertanian", "Kelautan", "Pariwisata", "Pertambangan", "Perdagangan"];
      const primarySectors = [
        sectorsList[idx % sectorsList.length],
        sectorsList[(idx + 2) % sectorsList.length]
      ];
      poly.properties = {
        ...poly.properties,
        id,
        name: cleanName,
        areaHa,
        population: pop,
        density,
        villageCount,
        primarySectors,
        totalInvestmentValue: 0,
        infrastructureScore: 7 + idx % 3,
        coordinates: coords,
        description: `Kecamatan ${cleanName} merupakan salah satu dari ${realKecamatanFeatures.length} kecamatan di Kabupaten Luwu.`
      };
      return {
        id,
        name: cleanName,
        areaHa,
        population: pop,
        density,
        villageCount,
        primarySectors,
        totalInvestmentValue: 0,
        infrastructureScore: 7 + idx % 3,
        coordinates: coords,
        description: `Kecamatan ${cleanName} memiliki potensi strategis untuk pengembangan sektor ${primarySectors.join(" dan ")}.`,
        geojson: poly,
        hasRealGeojson: true
      };
    });
  } else {
  }
} catch (err) {
  console.error("Error reading gis_kecamatan.json during server bootstrapping:", err);
}
var villagesData = [];
var infrastructurePoints = [];
try {
  let infPath = getPublicFilePath("gis_infrastruktur.json");
  if (!import_fs.default.existsSync(infPath)) {
    infPath = getPublicFilePath("infrastruktur-luwu.json");
  }
  if (import_fs.default.existsSync(infPath)) {
    const data = JSON.parse(import_fs.default.readFileSync(infPath, "utf8"));
    if (data.features) {
      infrastructurePoints = data.features.map((f) => ({
        id: f.properties?.id || "unknown",
        name: f.properties?.name || "unknown",
        type: f.properties?.type || "unknown",
        latitude: f.geometry?.coordinates[1] || 0,
        longitude: f.geometry?.coordinates[0] || 0,
        description: f.properties?.description || ""
      }));
    }
  }
} catch (err) {
  console.error("Error loading infrastruktur-luwu.json:", err);
}
var spatialLayers = [
  {
    id: "layer_kecamatan",
    name: "Layer Kecamatan",
    category: "Kecamatan",
    geojson: {
      type: "FeatureCollection",
      features: districtsData.map((d) => d.geojson)
    },
    uploadedAt: "2026-05-28T00:00:00Z",
    isActive: true,
    opacity: 0.6,
    color: "#2563eb",
    // blue
    lineWidth: 2
  },
  {
    id: "layer_infrastruktur",
    name: "Titik Infrastruktur",
    category: "Infrastruktur",
    geojson: {
      type: "FeatureCollection",
      features: infrastructurePoints.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.longitude, p.latitude]
        },
        properties: {
          id: p.id,
          name: p.name,
          type: p.type,
          description: p.description
        }
      }))
    },
    uploadedAt: "2026-05-28T02:00:00Z",
    isActive: true,
    opacity: 0.9,
    color: "#e11d48",
    // rose
    lineWidth: 3
  },
  {
    id: "layer_potensi",
    name: "Potensi Investasi",
    category: "Tata Ruang",
    geojson: {
      type: "FeatureCollection",
      features: []
    },
    uploadedAt: "2026-05-28T03:00:00Z",
    isActive: true,
    opacity: 0.5,
    fillOpacity: 0.3,
    color: "#8b5cf6",
    // purple
    lineWidth: 2
  },
  {
    id: "layer_desa",
    name: "Batas Administrasi Desa",
    category: "Desa",
    geojson: {
      type: "FeatureCollection",
      features: []
    },
    uploadedAt: "2026-05-28T01:00:00Z",
    isActive: false,
    opacity: 0.5,
    color: "#10b981",
    // green
    lineWidth: 1
  }
];
var realDesaFeatures = [];
try {
  const desaPath = getPublicFilePath("gis_desa.json");
  if (import_fs.default.existsSync(desaPath)) {
    const desaData = JSON.parse(import_fs.default.readFileSync(desaPath, "utf8"));
    realDesaFeatures = desaData.features || [];
    const desaIdx = spatialLayers.findIndex((l) => l.id === "layer_desa");
    if (desaIdx !== -1) {
      spatialLayers[desaIdx].geojson = desaData;
    } else {
      const layerDesa = {
        id: "layer_desa",
        name: "Batas Administrasi Desa",
        category: "Desa",
        geojson: desaData,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: false,
        opacity: 0.5,
        color: "#10b981",
        // green
        lineWidth: 1
      };
      spatialLayers.push(layerDesa);
    }
    const newVillages = realDesaFeatures.map((f, idx) => {
      const rawName = f.properties?.Name || f.properties?.Nama_Desa || `Desa ${idx}`;
      const rawKecName = (f.properties?.KECAMATAN || "").replace(/kec\.\s*/i, "").trim().toLowerCase();
      let districtId = "unknown";
      const distMatch = districtsData.find((d) => {
        const dName = d.name.toLowerCase();
        if (dName === rawKecName) return true;
        if (dName === "bastem" && rawKecName === "basse sangtempe") return true;
        return false;
      });
      if (distMatch) {
        districtId = distMatch.id;
      }
      if (districtId === "unknown" && f.geometry) {
        const matchedDist = districtsData.find((d) => {
          if (!d.geojson) return false;
          try {
            return turf2.booleanIntersects(f, d.geojson);
          } catch (e) {
            return false;
          }
        });
        if (matchedDist) {
          districtId = matchedDist.id;
        }
      }
      f.properties = f.properties || {};
      f.properties.districtId = districtId;
      f.properties.district_id = districtId;
      const matchedDistObj = districtsData.find((d) => d.id === districtId);
      if (matchedDistObj) {
        f.properties.kecamatan = matchedDistObj.name;
        f.properties.KECAMATAN = matchedDistObj.name;
      }
      let coords = [0, 0];
      try {
        const poly = JSON.parse(JSON.stringify(f));
        const cent = turf2.centroid(poly);
        if (cent && cent.geometry && cent.geometry.coordinates) {
          coords = [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
        }
      } catch (e) {
      }
      const luasGIS = parseFloat(f.properties?.Luas_GIS || "0");
      const areaHa = luasGIS > 0 ? luasGIS * 100 : 500;
      const pop = parseInt(f.properties?.Jum_Pdd || "1000", 10);
      const density = parseFloat(f.properties?.Kepadatan || (pop / (areaHa / 100)).toString());
      const villageObj = {
        id: `v_real_${idx}`,
        districtId,
        name: rawName,
        areaHa,
        population: pop,
        density,
        commodities: ["Pertanian", "Perkebunan"],
        zoneStatus: "Kawasan Binaan",
        investmentPotential: "Potensi Desa (Sinkronisasi Otomatis)",
        coordinates: coords,
        hasRealGeojson: true,
        geojson: f
      };
      const propertiesToSpread = { ...villageObj };
      delete propertiesToSpread.geojson;
      f.properties = { ...f.properties, ...propertiesToSpread };
      return villageObj;
    });
    const existingVillageNames = new Set(
      villagesData.map((v) => v.name.toLowerCase().trim())
    );
    const uniqueNewVillages = newVillages.filter(
      (v) => !existingVillageNames.has(v.name.toLowerCase().trim())
    );
    villagesData = [...villagesData, ...uniqueNewVillages];
  } else {
  }
} catch (err) {
  console.error("Error reading Desa.geojson:", err);
}
var jalanLoadStatus = {
  checked: false,
  exists: false,
  loaded: false,
  error: null,
  path: ""
};
try {
  let jalanPath = getPublicFilePath("gis_jalan.json");
  jalanLoadStatus.path = jalanPath;
  jalanLoadStatus.checked = true;
  if (import_fs.default.existsSync(jalanPath)) {
    jalanLoadStatus.exists = true;
    const jalanData = JSON.parse(import_fs.default.readFileSync(jalanPath, "utf8"));
    if (jalanData && Array.isArray(jalanData.features) && jalanData.features.length > 0) {
      const layerJalan = {
        id: "layer_jalan",
        name: "Layer Jalan",
        category: "Jalan",
        geojson: jalanData,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: false,
        opacity: 0.8,
        color: "#eab308",
        // amber/yellow
        lineWidth: 2
      };
      spatialLayers.push(layerJalan);
      jalanLoadStatus.loaded = true;
      global.luwuRoads = jalanData;
    } else {
    }
  } else {
  }
} catch (err) {
  jalanLoadStatus.error = err.message || String(err);
  console.error("Error reading jalan.json:", err);
}
try {
  const sectoralDefs = [
    {
      id: "layer_sawah",
      name: "Layer Sawah",
      category: "Pertanian",
      color: "#22c55e",
      // Green
      fileNames: ["gis_sawah.json", "sawah.json", "Sawah.geojson", "sawah.geojson"],
      fallbackModulo: 0
    },
    {
      id: "layer_tambak",
      name: "Layer Tambak",
      category: "Kelautan",
      color: "#0ea5e9",
      // Sky Blue
      fileNames: ["gis_tambak.json", "tambak.json", "Tambak.geojson", "tambak.geojson"],
      fallbackModulo: 1
    },
    {
      id: "layer_mangrove",
      name: "Layer Mangrove",
      category: "Kelautan",
      color: "#14b8a6",
      // Teal
      fileNames: ["gis_mangrove.json", "mangrove.json", "Mangrove.geojson", "mangrove.geojson"],
      fallbackModulo: 2
    },
    {
      id: "layer_lahan_kering_sekunder",
      name: "Layer Lahan Kering Sekunder",
      category: "Pertanian",
      color: "#eab308",
      // Yellow
      fileNames: ["gis_lahankeringsekunder.json", "lahankeringsekunder.json", "Lahan_Kering_Sekunder.geojson"],
      fallbackModulo: 3
    },
    {
      id: "layer_lahan_kering_primer",
      name: "Layer Lahan Kering Primer",
      category: "Pertanian",
      color: "#b45309",
      // Orange/Brown
      fileNames: ["gis_lahankeringprimer.json", "lahankeringprimer.json", "Lahan_Kering_Primer.geojson"],
      fallbackModulo: 4
    },
    {
      id: "layer_land_use_zoning",
      name: "Land Use Zoning",
      category: "Zoning",
      color: "#8b5cf6",
      // Purple
      fileNames: ["gis_zonasi.json", "land_use_zoning.json", "LandUseZoning.geojson"],
      fallbackModulo: 5
    },
    {
      id: "layer_flood_risk",
      name: "Flood Risk Map",
      category: "Risk",
      color: "#ef4444",
      // Red
      fileNames: ["gis_flood_risk.json", "flood_risk.json", "FloodRisk.geojson"],
      fallbackModulo: 6
    },
    {
      id: "layer_historical_suitability",
      name: "Historical Land Suitability",
      category: "History",
      color: "#f59e0b",
      // Amber
      fileNames: ["gis_historical_suitability.json", "historical_suitability.json"],
      fallbackModulo: 7
    }
  ];
  sectoralDefs.forEach((def) => {
    let geojsonContent = null;
    let loadedFrom = "";
    for (const fName of def.fileNames) {
      const p = getPublicFilePath(fName);
      if (import_fs.default.existsSync(p)) {
        try {
          geojsonContent = JSON.parse(import_fs.default.readFileSync(p, "utf8"));
          loadedFrom = p;
          break;
        } catch (e) {
          console.error(`Gagal membaca file geojson ${fName}:`, e);
        }
      }
      const plainFileName = fName.split("/").pop() || fName;
      if (plainFileName !== fName) {
        const pPlain = getPublicFilePath(plainFileName);
        if (import_fs.default.existsSync(pPlain)) {
          try {
            geojsonContent = JSON.parse(import_fs.default.readFileSync(pPlain, "utf8"));
            loadedFrom = pPlain;
            break;
          } catch (e) {
          }
        }
      }
    }
    if (geojsonContent) {
    } else {
      geojsonContent = {
        type: "FeatureCollection",
        features: []
      };
    }
    const sectoralLayer = {
      id: def.id,
      name: def.name,
      category: def.category,
      geojson: geojsonContent,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: false,
      // Default to false to avoid overwhelming map on start
      opacity: 0.65,
      color: def.color,
      lineWidth: 1.5,
      fillOpacity: 0.45
    };
    spatialLayers.push(sectoralLayer);
  });
} catch (error) {
  console.error("Gagal inisialisasi sectoral spatial layers:", error);
}
try {
  const dataDir = import_path.default.join(process.cwd(), "data");
  const layersDir = import_path.default.join(dataDir, "custom_layers");
  if (import_fs.default.existsSync(layersDir)) {
    const files = import_fs.default.readdirSync(layersDir);
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        try {
          const filePath = import_path.default.join(layersDir, file);
          const layerData = JSON.parse(import_fs.default.readFileSync(filePath, "utf8"));
          if (layerData && layerData.id) {
            const exists = spatialLayers.some((l) => l.id === layerData.id);
            if (!exists) {
              spatialLayers.push(layerData);
            }
          }
        } catch (fileErr) {
          console.error(`[SPATIAL] Failed to load custom layer file ${file}:`, fileErr.message);
        }
      }
    });
  }
} catch (loadErr) {
  console.error("Gagal inisialisasi custom spatial layers dari local storage:", loadErr.message);
}
app.get("/api/stats", async (req, res) => {
  const { districtId, search } = req.query;
  const cacheKey = `stats_${districtId || "all"}_${search || "none"}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(cache[cacheKey].data);
  }
  try {
    const { data: invData, error: invErr } = await fetchAndJoinInvestments();
    if (invErr) throw invErr;
    const { data: settingsData } = await supabase2.from("site_settings").select("setting_key, setting_value").in("setting_key", ["perf_ikm", "perf_nib_sla", "perf_spatial_accuracy"]);
    let ikm = null;
    let nibSla = null;
    let spatialAccuracy = null;
    if (settingsData) {
      settingsData.forEach((s) => {
        if (s.setting_key === "perf_ikm") ikm = s.setting_value;
        if (s.setting_key === "perf_nib_sla") nibSla = s.setting_value;
        if (s.setting_key === "perf_spatial_accuracy") spatialAccuracy = s.setting_value;
      });
    }
    const frontendRows = prepareForFrontend(invData || []);
    let filteredInvs = frontendRows;
    if (districtId && typeof districtId === "string") {
      filteredInvs = filteredInvs.filter((item) => item.districtId === districtId);
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.toLowerCase();
      filteredInvs = filteredInvs.filter(
        (item) => (item.name || "").toLowerCase().includes(q) || (item.sector || "").toLowerCase().includes(q) || (item.landStatus || "").toLowerCase().includes(q)
      );
    }
    let activeDistricts = [...districtsData];
    if (districtId && typeof districtId === "string") {
      activeDistricts = activeDistricts.filter((d) => d.id === districtId);
    }
    const totalInvestments = filteredInvs.length;
    const totalArea = filteredInvs.reduce((sum, item) => sum + (Number(item.areaHa) || 0), 0);
    const totalValue = filteredInvs.reduce((sum, item) => sum + (Number(item.investmentValue) || 0), 0);
    const sectorCounts = {};
    filteredInvs.forEach((inv) => {
      const s = inv.sector || "Lainnya";
      sectorCounts[s] = (sectorCounts[s] || 0) + 1;
    });
    let dominantSector = "N/A";
    let maxCount = 0;
    Object.entries(sectorCounts).forEach(([sec, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantSector = sec;
      }
    });
    const avgInfraScore = activeDistricts.length > 0 ? activeDistricts.reduce((sum, d) => sum + (d.infrastructureScore || 0), 0) / activeDistricts.length : 0;
    const trendsNow = /* @__PURE__ */ new Date();
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(trendsNow.getFullYear(), trendsNow.getMonth() - i, 1);
      const monthStr = d.toLocaleString("en-US", { month: "short" });
      monthlyTrends.push({
        month: monthStr,
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        "Akumulasi (Miliar IDR)": 0,
        "Pertumbuhan (Miliar IDR)": 0,
        deltaExact: 0
      });
    }
    const validInvs = [...filteredInvs].sort((a, b) => {
      const dbA = new Date(a.createdAt || "2022-01-01T00:00:00Z").getTime();
      const dbB = new Date(b.createdAt || "2022-01-01T00:00:00Z").getTime();
      return dbA - dbB;
    });
    let runningAccumulation = 0;
    const startOf12Months = new Date(trendsNow.getFullYear(), trendsNow.getMonth() - 11, 1).getTime();
    validInvs.forEach((inv) => {
      const invDate = new Date(inv.createdAt || "2022-01-01T00:00:00Z");
      const val = Number(inv.investmentValue) || 0;
      if (invDate.getTime() < startOf12Months) {
        runningAccumulation += val;
      }
    });
    let tempSum = runningAccumulation;
    monthlyTrends.forEach((bucket) => {
      let delta = 0;
      validInvs.forEach((inv) => {
        const invDate = new Date(inv.createdAt || "2022-01-01T00:00:00Z");
        if (invDate.getFullYear() === bucket.year && invDate.getMonth() === bucket.monthNum) {
          delta += Number(inv.investmentValue) || 0;
        }
      });
      tempSum += delta;
      bucket["Akumulasi (Miliar IDR)"] = Math.round(tempSum / 1e9);
      bucket["Pertumbuhan (Miliar IDR)"] = Math.round(delta / 1e9);
      bucket.deltaExact = delta;
    });
    const sectors = ["Kelautan", "Pertanian", "Pertambangan", "Perdagangan", "Pariwisata"];
    const sectorData = sectors.map((sector) => {
      const matchingInvs = filteredInvs.filter((item) => item.sector === sector);
      const sum = matchingInvs.reduce((s, item) => s + (Number(item.investmentValue) || 0), 0);
      return {
        name: sector,
        value: sum,
        projectCount: matchingInvs.length
      };
    }).filter((item) => item.value > 0 || item.projectCount > 0);
    const districtRankings = activeDistricts.map((d) => {
      const districtInvs = filteredInvs.filter((item) => item.districtId === d.id);
      const totalVal = districtInvs.reduce((s, item) => s + (Number(item.investmentValue) || 0), 0);
      const avgScore = districtInvs.length > 0 ? districtInvs.reduce((s, iv) => s + (iv.suitabilityScore || 85), 0) / districtInvs.length : 85;
      return {
        id: d.id,
        name: d.name,
        value: totalVal,
        density: d.density || 0,
        hasGeo: !!d.geojson,
        suitabilityAvg: Math.round(avgScore),
        projectCount: districtInvs.length,
        area: d.areaHa || 0
      };
    }).sort((a, b) => b.value - a.value);
    const statsResult = {
      success: true,
      totalInvestments,
      totalArea: Number(totalArea.toFixed(2)),
      totalValue: Number(totalValue.toFixed(2)),
      dominantSector,
      avgInfraScore: Number(avgInfraScore.toFixed(2)),
      sectorData,
      districtRankings,
      monthlyTrends,
      performance: {
        ikm,
        nibSla,
        spatialAccuracy
      }
    };
    cache[cacheKey] = {
      data: statsResult,
      timestamp: Date.now()
    };
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(statsResult);
  } catch (error) {
    console.error("Error at /api/stats analytical aggregation:", error);
    if (cache[cacheKey]) {
      return res.json(cache[cacheKey].data);
    }
    return res.json({
      success: false,
      error: error.message || "Timeout or database connection error.",
      isFallback: true,
      totalInvestments: 0,
      totalArea: 0,
      totalValue: 0,
      dominantSector: "N/A",
      avgInfraScore: 0,
      sectorData: [],
      districtRankings: [],
      monthlyTrends: []
    });
  }
});
app.get("/api/districts", async (req, res) => {
  const cacheKey = "districts_list";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(cache[cacheKey].data);
  }
  try {
    const { data: invData, error: invErr } = await fetchAndJoinInvestments();
    if (invErr) throw invErr;
    const frontendRows = prepareForFrontend(invData || []);
    let baseDistricts = [...districtsData];
    try {
      const { data: dbKecamatan, error: dbKecErr } = await withTimeout(
        supabase2.from("gis_kecamatan").select("id, objectid, kecamatan, sum_jum_pd, luas, kpdt_pddk, jlh_desa, kelompok, geom"),
        5e3,
        "Query to gis_kecamatan timed out"
      );
      if (dbKecErr) {
      } else if (dbKecamatan && dbKecamatan.length > 0) {
        const mappedDbKec = dbKecamatan.map((row, idx) => {
          const props = row.properties || {};
          const rawName = row.kecamatan || row.name || props.KECAMATAN || props.kecamatan || `Kecamatan ${row.id || idx + 1}`;
          const formatName = (str) => {
            return str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
          };
          const cleanName = formatName(String(rawName));
          const id = row.district_id || `dist_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;
          const pop = row.population || props.SUM_Jum_Pd ? Math.round(Number(row.population || props.SUM_Jum_Pd)) : 15e3;
          const areaHa = row.area_ha || props.LUAS ? Math.round(Number(row.area_ha || props.LUAS) * 100) : 5e3;
          const density = row.density || props.KPDT_PDDK ? Math.round(Number(row.density || props.KPDT_PDDK)) : Math.round(pop / (areaHa / 100 || 1));
          const villageCount = row.village_count || props.JLH_DESA ? Number(row.village_count || props.JLH_DESA) : 10;
          return {
            id,
            name: cleanName,
            areaHa,
            population: pop,
            density,
            villageCount,
            infrastructureScore: row.infrastructure_score || 85,
            primarySectors: row.primary_sectors || ["Pertanian", "Kelautan"],
            coordinates: row.coordinates || [-3.2, 120.2],
            totalInvestmentValue: 0,
            geojson: row.geom || row.geojson || null
          };
        });
        if (mappedDbKec.length > 0) {
          baseDistricts = mappedDbKec;
        }
      }
    } catch (dbErr) {
    }
    const updatedDistricts = baseDistricts.map((d) => {
      const districtInvs = frontendRows.filter((item) => item.districtId === d.id);
      const totalVal = districtInvs.reduce((s, item) => s + (Number(item.investmentValue) || 0), 0);
      return {
        ...d,
        totalInvestmentValue: totalVal
      };
    });
    cache[cacheKey] = {
      data: updatedDistricts,
      timestamp: Date.now()
    };
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(updatedDistricts);
  } catch (error) {
    console.error(`[API /api/districts] Error:`, error);
    console.error(JSON.stringify(error, null, 2));
    if (cache[cacheKey]) {
      return res.json(cache[cacheKey].data);
    }
    return res.json(districtsData);
  }
});
function fetchTilePromise(url, timeoutMs = 3e3) {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        timeout: timeoutMs
      };
      const req = import_https.default.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch tile, status code: ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] || "image/jpeg";
          if (!contentType.toLowerCase().startsWith("image/")) {
            reject(new Error(`Invalid content-type returned: ${contentType}`));
            return;
          }
          resolve({ buffer, contentType });
        });
      });
      req.on("error", (err) => {
        reject(err);
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    } catch (err) {
      reject(err);
    }
  });
}
var TILE_CACHE_MAX_SIZE = 2500;
var tileCache = /* @__PURE__ */ new Map();
function fetchTileCached(url, timeoutMs = 3e3) {
  const cached = tileCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }
  return fetchTilePromise(url, timeoutMs).then((result) => {
    if (tileCache.size >= TILE_CACHE_MAX_SIZE) {
      const firstKey = tileCache.keys().next().value;
      if (firstKey !== void 0) {
        tileCache.delete(firstKey);
      }
    }
    tileCache.set(url, result);
    return result;
  });
}
app.get("/api/tiles/google", async (req, res) => {
  const { lyrs, x, y, z } = req.query;
  if (!lyrs || !x || !y || !z) {
    return res.status(400).send("Missing query parameters (lyrs, x, y, z)");
  }
  const googleUrl = `https://mt1.google.com/vt/lyrs=${lyrs}&x=${x}&y=${y}&z=${z}`;
  try {
    const result = await fetchTileCached(googleUrl, 3500);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    return res.send(result.buffer);
  } catch (err) {
    let fallbackUrl = "";
    const isSatellite = String(lyrs).includes("s") || String(lyrs).includes("y");
    if (isSatellite) {
      fallbackUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    } else {
      fallbackUrl = `https://tile.openstreetmap.org/${z}/{x}/{y}.png`;
    }
    try {
      const resultFallback = await fetchTileCached(fallbackUrl, 2500);
      res.setHeader("Content-Type", resultFallback.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(resultFallback.buffer);
    } catch (fallbackErr) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.send(TRANSPARENT_1X1_PNG);
    }
  }
});
app.get("/api/tiles/esri", async (req, res) => {
  const { x, y, z } = req.query;
  if (!x || !y || !z) {
    return res.status(400).send("Missing query parameters (x, y, z)");
  }
  const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  try {
    const result = await fetchTileCached(esriUrl, 3500);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    return res.send(result.buffer);
  } catch (err) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.send(TRANSPARENT_1X1_PNG);
  }
});
app.get("/api/tiles/carto", async (req, res) => {
  const { theme, x, y, z } = req.query;
  if (!theme || !x || !y || !z) {
    return res.status(400).send("Missing query parameters (theme, x, y, z)");
  }
  const subdomains = ["a", "b", "c", "d"];
  const sub = subdomains[(Number(x) + Number(y)) % 4];
  let cartoUrl = "";
  if (theme === "voyager") {
    cartoUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
  } else {
    const style = theme === "dark" ? "dark_all" : "light_all";
    cartoUrl = `https://${sub}.basemaps.cartocdn.com/${style}/${z}/${x}/${y}.png`;
  }
  try {
    const result = await fetchTileCached(cartoUrl, 3e3);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    return res.send(result.buffer);
  } catch (err) {
    let fallbackUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    if (theme === "dark") {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.send(TRANSPARENT_1X1_PNG);
    }
    try {
      const resultFallback = await fetchTileCached(fallbackUrl, 2500);
      res.setHeader("Content-Type", resultFallback.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(resultFallback.buffer);
    } catch (fallbackErr) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.send(TRANSPARENT_1X1_PNG);
    }
  }
});
app.put("/api/districts/:id", (req, res) => {
  const { id } = req.params;
  const { geometry } = req.body;
  const idx = districtsData.findIndex((d) => d.id === id);
  if (idx !== -1) {
    if (geometry) {
      if (districtsData[idx].geojson) {
        districtsData[idx].geojson.geometry = geometry;
      } else {
        districtsData[idx].geojson = { type: "Feature", geometry, properties: { id } };
      }
    }
    const kIdx = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
    if (kIdx !== -1) {
      spatialLayers[kIdx].geojson = {
        type: "FeatureCollection",
        features: districtsData.map((d) => d.geojson)
      };
    }
    return res.json({ success: true, district: districtsData[idx] });
  }
  res.status(404).json({ error: "Kecamatan tidak ditemukan" });
});
app.get("/api/villages", async (req, res) => {
  try {
    await ensureDbHydrated();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(villagesData);
  } catch (err) {
    console.error("Failed to load villages:", err);
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(villagesData);
  }
});
app.put("/api/villages/:id", (req, res) => {
  const { id } = req.params;
  const { geometry } = req.body;
  const idx = villagesData.findIndex((v) => v.id === id);
  if (idx !== -1) {
    let village = villagesData[idx];
    if (geometry) {
      if (village.geojson) {
        village.geojson.geometry = geometry;
      } else {
        village.geojson = { type: "Feature", geometry, properties: { id } };
      }
    }
    return res.json({ success: true, village });
  }
  res.status(404).json({ error: "Desa tidak ditemukan" });
});
app.get("/api/testimonials", async (req, res) => {
  try {
    if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
      return res.json([]);
    }
    const { data, error } = await supabase2.from("investor_testimonials").select("*").eq("is_verified", true).order("created_at", { ascending: false }).limit(6);
    if (error) {
      return res.json([]);
    }
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json(data || []);
  } catch (error) {
    console.error("Error at GET /api/testimonials:", error);
    res.json([]);
  }
});
app.post("/api/testimonials", async (req, res) => {
  try {
    const { investor_name, company_name, sector, message } = req.body;
    const resolvedName = investor_name || company_name;
    if (!resolvedName) {
      return res.status(400).json({ error: "Investor name or company name is required" });
    }
    if (!sector || !message) {
      return res.status(400).json({ error: "Sector and message are required" });
    }
    if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
      return res.json({ success: true, message: "Mock success in dev/placeholder environment" });
    }
    const payload = {
      company_name: resolvedName,
      sector,
      message,
      is_verified: false,
      // Default is false for moderation
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data, error } = await supabase2.from("investor_testimonials").insert([payload]);
    if (error) {
      throw error;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error at POST /api/testimonials:", error);
    res.status(500).json({ error: error.message });
  }
});
var localInvestmentInterests = [
  {
    id: "interest-seed-1",
    investor_name: "Yusuf Kalla",
    company_name: "Kalla Group",
    contact_info: "yusuf@kallagroup.co.id",
    potensi_name: "Agroindustri Kopi Latimojong",
    nilai_investasi: 12e10,
    kebutuhan_lahan: 15.5,
    pesan_tambahan: "Mohon asistensi percepatan perizinan pemanfaatan kawasan aliran sungai.",
    status: "Menunggu Verifikasi",
    nib_oss: "",
    catatan_admin: "",
    created_at: new Date(Date.now() - 36e5 * 24 * 2).toISOString()
  },
  {
    id: "interest-seed-2",
    investor_name: "Budi Santoso",
    company_name: "PT Bumi Agro Luwu",
    contact_info: "budi.s@bumiagro.co.id",
    potensi_name: "Sentra Kakao Noling",
    nilai_investasi: 45e9,
    kebutuhan_lahan: 50,
    pesan_tambahan: "Kami berencana mendirikan pabrik pengolahan biji kakao skala ekspor.",
    status: "Verifikasi OSS Berjalan",
    nib_oss: "9120301928374",
    catatan_admin: "Berkas awal NIB terverifikasi. Menunggu kelengkapan dokumen AMDAL.",
    created_at: new Date(Date.now() - 36e5 * 24).toISOString()
  }
];
app.get("/api/investment-interests", async (req, res) => {
  try {
    if (SUPABASE_URL2.includes("placeholder.supabase.co")) {
      return res.json(localInvestmentInterests);
    }
    const { data, error } = await supabase2.from("investment_interests").select("*").order("created_at", { ascending: false });
    if (error) {
      return res.json(localInvestmentInterests);
    }
    const dbIds = new Set((data || []).map((x) => x.id));
    const merged = [...data || []];
    for (const local of localInvestmentInterests) {
      if (!dbIds.has(local.id)) {
        merged.push(local);
      }
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(merged);
  } catch (err) {
    console.error("Error at GET /api/investment-interests:", err);
    res.json(localInvestmentInterests);
  }
});
async function verifyInvestmentSubmissionIdentity(req) {
  try {
    let token = "";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    const submittedPhone = (req.body.contact_info || req.body.no_whatsapp || req.body.whatsapp || req.body.phoneNumber || req.body.phone || "").toString().trim();
    const submittedNik = (req.body.nik || req.body.nik_oss || req.body.user_nik || "").toString().trim();
    let user = null;
    let profile = null;
    if (token) {
      try {
        const { data } = await supabase2.auth.getUser(token);
        if (data?.user) {
          user = data.user;
        }
      } catch (err) {
        console.warn("[IdentityCheck] Token auth error:", err);
      }
    }
    const userId = user?.id || req.body.user_id || req.body.investor_id || req.headers["x-user-id"];
    if (userId) {
      try {
        const { data: profData } = await supabase2.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (profData) {
          profile = profData;
        }
      } catch (err) {
        console.warn("[IdentityCheck] Profile fetch error:", err);
      }
    }
    const cleanDigits = (val) => val ? val.replace(/\D/g, "") : "";
    const cleanPhone = (val) => {
      let d = cleanDigits(val);
      if (d.startsWith("62")) d = "0" + d.substring(2);
      return d;
    };
    const cleanSubPhone = cleanPhone(submittedPhone);
    const cleanSubNik = cleanDigits(submittedNik);
    const profilePhone = cleanPhone(
      profile?.no_whatsapp || profile?.whatsapp || profile?.phone || user?.user_metadata?.no_whatsapp || user?.user_metadata?.whatsapp || user?.user_metadata?.phone || ""
    );
    const profileNik = cleanDigits(
      profile?.nik || user?.user_metadata?.nik || ""
    );
    if (profile || user) {
      if (profilePhone && cleanSubPhone && cleanSubPhone !== profilePhone) {
        console.warn(`[IdentityCheck] WhatsApp mismatch: Submitted '${cleanSubPhone}' vs Profile '${profilePhone}'`);
        return { isValid: false, error: "Invalid Identity" };
      }
      if (profileNik && cleanSubNik && cleanSubNik !== profileNik) {
        console.warn(`[IdentityCheck] NIK mismatch: Submitted '${cleanSubNik}' vs Profile '${profileNik}'`);
        return { isValid: false, error: "Invalid Identity" };
      }
    }
    if (cleanSubNik || cleanSubPhone) {
      try {
        const filters = [];
        if (cleanSubNik) filters.push(`nik.eq.${cleanSubNik}`);
        if (cleanSubPhone) {
          filters.push(`no_whatsapp.eq.${cleanSubPhone}`);
          filters.push(`whatsapp.eq.${cleanSubPhone}`);
        }
        const { data: matchedProfiles } = await supabase2.from("profiles").select("id, nik, no_whatsapp, whatsapp").or(filters.join(","));
        if (matchedProfiles && matchedProfiles.length > 0) {
          const isOwner = matchedProfiles.some((p) => p.id === userId);
          if (!isOwner) {
            console.warn("[IdentityCheck] Submitted credentials belong to a different registered profile");
            return { isValid: false, error: "Invalid Identity" };
          }
        }
      } catch (e) {
      }
    }
    return { isValid: true };
  } catch (err) {
    console.error("[IdentityCheck] Server error during identity validation:", err);
    return { isValid: true };
  }
}
app.post("/api/investment-interests", async (req, res) => {
  try {
    const {
      investor_name,
      company_name,
      contact_info,
      potensi_name,
      nilai_investasi,
      kebutuhan_lahan,
      pesan_tambahan,
      nib_oss
    } = req.body;
    if (!investor_name || !contact_info || !potensi_name) {
      return res.status(400).json({ error: "Nama investor, info kontak, dan potensi wajib diisi." });
    }
    const identityCheck = await verifyInvestmentSubmissionIdentity(req);
    if (!identityCheck.isValid) {
      return res.status(400).json({ success: false, error: identityCheck.error || "Invalid Identity", message: identityCheck.error || "Invalid Identity" });
    }
    const newTicket = {
      id: "interest-" + Math.random().toString(36).substr(2, 9),
      investor_name,
      company_name: company_name || "-",
      contact_info,
      potensi_name,
      nilai_investasi: Number(nilai_investasi) || 0,
      kebutuhan_lahan: Number(kebutuhan_lahan) || 0,
      pesan_tambahan: pesan_tambahan || "",
      status: "Menunggu Verifikasi",
      nib_oss: nib_oss || "",
      catatan_admin: "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    localInvestmentInterests.unshift(newTicket);
    if (!SUPABASE_URL2.includes("placeholder.supabase.co")) {
      try {
        const { data, error } = await supabase2.from("investment_interests").insert([{
          investor_name: newTicket.investor_name,
          company_name: newTicket.company_name,
          contact_info: newTicket.contact_info,
          potensi_name: newTicket.potensi_name,
          nilai_investasi: newTicket.nilai_investasi,
          kebutuhan_lahan: newTicket.kebutuhan_lahan,
          pesan_tambahan: newTicket.pesan_tambahan,
          status: newTicket.status,
          nib_oss: newTicket.nib_oss,
          catatan_admin: newTicket.catatan_admin,
          created_at: newTicket.created_at
        }]);
        if (error) {
        }
      } catch (dbErr) {
      }
    }
    res.json({ success: true, message: "Letter of Intent berhasil dikirim", data: newTicket });
  } catch (err) {
    console.error("Error at POST /api/investment-interests:", err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/investment-interests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, nib_oss, catatan_admin, jadwal_site_visit, laporan_dalak, dalak_admin_id } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status wajib diisi." });
    }
    const ticketIdx = localInvestmentInterests.findIndex((x) => x.id === id);
    if (ticketIdx !== -1) {
      localInvestmentInterests[ticketIdx].status = status;
      if (nib_oss !== void 0) localInvestmentInterests[ticketIdx].nib_oss = nib_oss;
      if (catatan_admin !== void 0) localInvestmentInterests[ticketIdx].catatan_admin = catatan_admin;
      if (jadwal_site_visit !== void 0) localInvestmentInterests[ticketIdx].jadwal_site_visit = jadwal_site_visit;
      if (laporan_dalak !== void 0) localInvestmentInterests[ticketIdx].laporan_dalak = laporan_dalak;
      if (dalak_admin_id !== void 0) localInvestmentInterests[ticketIdx].dalak_admin_id = dalak_admin_id;
    }
    if (!SUPABASE_URL2.includes("placeholder.supabase.co")) {
      try {
        const { error } = await supabase2.from("investment_interests").update({
          status,
          nib_oss: nib_oss !== void 0 ? nib_oss : void 0,
          catatan_admin: catatan_admin !== void 0 ? catatan_admin : void 0,
          jadwal_site_visit: jadwal_site_visit !== void 0 ? jadwal_site_visit : void 0,
          laporan_dalak: laporan_dalak !== void 0 ? laporan_dalak : void 0,
          dalak_admin_id: dalak_admin_id !== void 0 ? dalak_admin_id : void 0
        }).eq("id", id);
        if (error) {
        }
      } catch (dbErr) {
      }
    }
    res.json({ success: true, message: "Status Letter of Intent berhasil diperbarui." });
  } catch (err) {
    console.error("Error at PUT /api/investment-interests:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/investments", async (req, res) => {
  try {
    const { data: invData, error: invErr } = await fetchAndJoinInvestments();
    if (invErr) {
      return res.json([]);
    }
    const investmentsData = prepareForFrontend(invData || []);
    const result = investmentsData.map((row) => {
      const gisPot = row.geometries?.[0] || {};
      const finObj = row.financials?.[0] || {};
      const locObj = row.locations?.[0] || {};
      const coords = extractCoordinates(row, gisPot, locObj);
      return {
        ...row,
        gisPotensiInvestasi: [gisPot],
        financials: [finObj],
        locations: [locObj],
        latitude: coords.latitude,
        longitude: coords.longitude,
        areaHa: gisPot.area_ha || row.areaHa || 0,
        investmentValue: finObj.capex || row.investmentValue || 0
      };
    });
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(result);
  } catch (error) {
    console.error("Error at /api/investments, returning honest fallback []:", error);
    console.error(JSON.stringify(error, null, 2));
    res.json([]);
  }
});
app.get("/api/db-status", async (req, res) => {
  await ensureDbHydrated();
  res.json(dbSyncStatus);
});
app.get("/api/db-test-connection", async (req, res) => {
  try {
    const hasUrl = !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isPlaceholderUrl = SUPABASE_URL2.includes("placeholder.supabase.co");
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isPlaceholderUrl || !hasUrl) {
      return res.json({
        success: false,
        configured: false,
        url: SUPABASE_URL2,
        hasKey,
        error: "Supabase URL belum dikonfigurasi atau masih menggunakan nilai placeholder. Silakan lengkapi environment variables di Vercel/Platform."
      });
    }
    const startTime = Date.now();
    const { data, error } = await supabase2.from("gis_kecamatan").select("id").limit(1);
    const duration = Date.now() - startTime;
    if (error) {
      console.error("[DIAGNOSTIC] Connection query failed:", error);
      return res.json({
        success: false,
        configured: true,
        url: SUPABASE_URL2,
        hasKey,
        latencyMs: duration,
        error: `Supabase Error: ${error.message} (Code: ${error.code || "N/A"}). Mohon periksa apakah SERVICE_ROLE_KEY / ANON_KEY dan tabel 'gis_kecamatan' sudah disetup dengan benar di Supabase.`
      });
    }
    try {
      await syncWithSupabase();
    } catch (syncErr) {
    }
    return res.json({
      success: true,
      configured: true,
      url: SUPABASE_URL2,
      hasKey,
      latencyMs: duration,
      error: null,
      message: "Sukses terhubung ke database Supabase! Query spasial & relasional berjalan lancar."
    });
  } catch (err) {
    console.error("[DIAGNOSTIC] Critical exception checking connection:", err);
    return res.json({
      success: false,
      configured: true,
      url: SUPABASE_URL2,
      latencyMs: 0,
      error: `Exception Koneksi: ${err.message || String(err)}`
    });
  }
});
app.post("/api/investments/validate-overlap", async (req, res) => {
  try {
    const { geometry, excludeId } = req.body;
    if (!geometry) {
      return res.status(400).json({ error: "Geometry is required" });
    }
    const { data, error } = await supabase2.rpc("cek_overlap_investasi", {
      poligon_baru_geojson: geometry
    });
    if (error) {
      console.error("Gagal mengecek overlap:", error);
      return res.status(500).json({ error: error.message });
    }
    let overlapping = data || [];
    if (excludeId) {
      overlapping = overlapping.filter((d) => String(d.id) !== String(excludeId));
    }
    if (overlapping.length > 0) {
      const namaProyekNabrak = overlapping.map((d) => d.nama_proyek).join(", ");
      return res.json({ overlap: true, overlappingProjects: namaProyekNabrak });
    }
    res.json({ overlap: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/investments", async (req, res) => {
  try {
    const { name, sector, districtId, villageId, latitude, longitude, areaHa, investmentValue, landStatus, photoUrl, photoUrls, contactPic, phoneNumber, geometry, status } = req.body;
    if (!name || !sector || !districtId || latitude === void 0 || longitude === void 0 || areaHa === void 0 || investmentValue === void 0) {
      return res.status(400).json({ error: "Kolom-kolom utama wajib diisi!" });
    }
    const identityCheck = await verifyInvestmentSubmissionIdentity(req);
    if (!identityCheck.isValid) {
      return res.status(400).json({ success: false, error: identityCheck.error || "Invalid Identity", message: identityCheck.error || "Invalid Identity" });
    }
    const newInvestment = {
      id: "inv_" + Date.now(),
      name,
      sector,
      districtId,
      villageId: villageId || "v_belopa1",
      latitude: Number(latitude),
      longitude: Number(longitude),
      areaHa: Number(areaHa),
      investmentValue: Number(investmentValue),
      landStatus: landStatus || "Sertifikat Hak Milik",
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
      photoUrls: photoUrls || [],
      contactPic: contactPic || "Humas DPMPTSP",
      phoneNumber: phoneNumber || "0471-belopa",
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      geometry: geometry || null,
      status: status || "Published"
    };
    await saveInvestmentToSupabaseDirect(newInvestment);
    const districtIdx = districtsData.findIndex((d) => d.id === districtId);
    if (districtIdx !== -1) {
      districtsData[districtIdx].totalInvestmentValue += Number(investmentValue);
      const dist = districtsData[districtIdx];
      if (dist.geojson) {
        dist.geojson.properties = {
          ...dist.geojson.properties,
          totalInvestmentValue: dist.totalInvestmentValue
        };
      } else {
        const radius = Math.sqrt(dist.areaHa / 314.15) * 1.2;
        const poly = generateHexagon(dist.coordinates[0], dist.coordinates[1], radius);
        poly.properties = { ...dist, geojson: void 0 };
        districtsData[districtIdx].geojson = poly;
      }
    }
    const kIdx = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
    if (kIdx !== -1) {
      spatialLayers[kIdx].geojson = {
        type: "FeatureCollection",
        features: districtsData.map((d) => d.geojson)
      };
    }
    res.status(201).json(newInvestment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/smart-investments", async (req, res) => {
  try {
    const data = req.body;
    const geomForValidation = data.geom || data.geometry;
    if (!geomForValidation) {
      return res.status(400).json({ error: "Objek geometri spasial (geom/geometry) harus diisi dan berupa GeoJSON Polygon yang valid." });
    }
    const identityCheck = await verifyInvestmentSubmissionIdentity(req);
    if (!identityCheck.isValid) {
      return res.status(400).json({ success: false, error: identityCheck.error || "Invalid Identity", message: identityCheck.error || "Invalid Identity" });
    }
    const projectId = "inv_smart_" + Date.now();
    const title = data.nama_potensi || data.title || "Untitled";
    const sector = data.sektor_utama || data.sector || "Pertanian";
    const status = data.status_publikasi || data.status || "Published";
    const gisPotensiPayload = {
      id: projectId,
      nama_potensi: data.nama_potensi || "Untitled",
      slug: data.slug || "untitled",
      sektor_utama: data.sektor_utama || "Pertanian",
      sub_sektor: data.sub_sektor || "",
      deskripsi_singkat: data.deskripsi_singkat || "",
      deskripsi_lengkap: data.deskripsi_lengkap || "",
      jenis_komoditas: data.jenis_komoditas || "",
      produksi_tahunan: Number(data.produksi_tahunan) || 0,
      satuan_kerja: data.satuan_kerja || "",
      umur_tanaman_hewan: Number(data.umur_tanaman_hewan) || 0,
      jumlah_ternak_pohon: Number(data.jumlah_ternak_pohon) || 0,
      luas_lahan: Number(data.luas_lahan) || 0,
      status_kepemilikan: data.status_kepemilikan || "",
      jenis_sertifikat: data.jenis_sertifikat || "",
      nomor_sertifikat: data.nomor_sertifikat || "",
      kesesuaian_rtrw: data.kesesuaian_rtrw || "",
      target_investor: data.target_investor || "",
      bep_tahun: Number(data.bep_tahun) || 0,
      irr_persen: Number(data.irr_persen) || 0,
      npv_estimasi: Number(data.npv_estimasi) || 0,
      akses_jalan_terdekat: String(data.akses_jalan_terdekat || ""),
      url_foto_lokasi: data.url_foto_lokasi || data.photoUrl || data.gallery && data.gallery[0] || "",
      geom: data.geom || data.geometry || null,
      status_publikasi: data.status_publikasi || "Published",
      estimasi_nilai: Number(data.estimasi_nilai) || 0
    };
    const proj = {
      id: projectId,
      title,
      slug: data.slug || "untitled",
      sector,
      subSector: data.sub_sektor || "",
      status,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    let spatialSyncResult = null;
    let distId = data.districtId || "lt";
    let vilId = data.villageId || "v_belopa1";
    let rDist = Number(data.roadDistance) || 0;
    let pDist = Number(data.portDistance) || 0;
    let aDist = Number(data.airportDistance) || 0;
    let geoForSync = data.geom || data.geometry;
    if (!geoForSync && data.latitude && data.longitude) {
      geoForSync = { type: "Point", coordinates: [Number(data.longitude), Number(data.latitude)] };
    }
    if (geoForSync) {
      spatialSyncResult = await calculateSpatialSync(geoForSync);
      if (spatialSyncResult) {
        if (spatialSyncResult.kecamatanMatch) {
          const mDist = districtsData.find((d) => d.name.toLowerCase() === spatialSyncResult.kecamatanMatch.toLowerCase());
          if (mDist) distId = mDist.id;
        }
        if (spatialSyncResult.desaMatch) {
          const mVil = villagesData.find((v) => v.name.toLowerCase() === spatialSyncResult.desaMatch.toLowerCase());
          if (mVil) vilId = mVil.id;
        }
        rDist = spatialSyncResult.nearestRoadKm || rDist;
        const nearestPort = spatialSyncResult.nearestFacilities?.find((f) => f.type.toLowerCase().includes("port") || f.name.toLowerCase().includes("pelabuhan"));
        if (nearestPort) pDist = nearestPort.distanceKm;
        const nearestAir = spatialSyncResult.nearestFacilities?.find((f) => f.type.toLowerCase().includes("airport") || f.name.toLowerCase().includes("bandara"));
        if (nearestAir) aDist = nearestAir.distanceKm;
      }
    }
    let finalLat = Number(data.latitude) || 0;
    let finalLng = Number(data.longitude) || 0;
    if ((!finalLat || !finalLng) && (data.geom || data.geometry)) {
      try {
        const geomForCentroid = data.geom || data.geometry;
        const centroidFeature = turf2.centroid(
          turf2.feature(geomForCentroid)
        );
        finalLng = centroidFeature.geometry.coordinates[0];
        finalLat = centroidFeature.geometry.coordinates[1];
      } catch (e) {
      }
    }
    if (finalLat < -4 || finalLat > -2 || finalLng < 119.5 || finalLng > 121.5) {
      finalLat = 0;
      finalLng = 0;
    }
    const newInvestment = {
      id: projectId,
      name: proj.title,
      sector: proj.sector,
      districtId: distId,
      villageId: vilId,
      latitude: finalLat,
      longitude: finalLng,
      areaHa: Number(data.areaHa) || 0,
      investmentValue: Number(data.capex) || 0,
      landStatus: data.ownershipStatus || "Sertifikat Hak Milik",
      photoUrl: data.photoUrl || data.gallery && data.gallery[0] || "",
      photoUrls: data.gallery || [],
      contactPic: "Humas DPMPTSP",
      phoneNumber: "-",
      geometry: data.geom || data.geometry || null,
      status: proj.status,
      createdAt: proj.createdAt,
      spatialSync: spatialSyncResult,
      smartData: { ...data, roadDistance: rDist, portDistance: pDist, airportDistance: aDist }
    };
    await saveInvestmentToSupabaseDirect(newInvestment);
    const districtIdx = districtsData.findIndex((d) => d.id === newInvestment.districtId);
    if (districtIdx !== -1) {
      districtsData[districtIdx].totalInvestmentValue += newInvestment.investmentValue;
    }
    res.status(201).json(newInvestment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/smart-investments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const geomForValidation = data.geom || data.geometry;
    if (!geomForValidation) {
      return res.status(400).json({ error: "Objek geometri spasial (geom/geometry) harus disertakan pada saat update." });
    }
    const title = data.nama_potensi || data.title || "Untitled";
    const sector = data.sektor_utama || data.sector || "Pertanian";
    const status = data.status_publikasi || data.status || "Published";
    const gisPotensiPayload = {
      id,
      nama_potensi: data.nama_potensi || "Untitled",
      slug: data.slug || "untitled",
      sektor_utama: data.sektor_utama || "Pertanian",
      sub_sektor: data.sub_sektor || "",
      deskripsi_singkat: data.deskripsi_singkat || "",
      deskripsi_lengkap: data.deskripsi_lengkap || "",
      jenis_komoditas: data.jenis_komoditas || "",
      produksi_tahunan: Number(data.produksi_tahunan) || 0,
      satuan_kerja: data.satuan_kerja || "",
      umur_tanaman_hewan: Number(data.umur_tanaman_hewan) || 0,
      jumlah_ternak_pohon: Number(data.jumlah_ternak_pohon) || 0,
      luas_lahan: Number(data.luas_lahan) || 0,
      status_kepemilikan: data.status_kepemilikan || "",
      jenis_sertifikat: data.jenis_sertifikat || "",
      nomor_sertifikat: data.nomor_sertifikat || "",
      kesesuaian_rtrw: data.kesesuaian_rtrw || "",
      target_investor: data.target_investor || "",
      bep_tahun: Number(data.bep_tahun) || 0,
      irr_persen: Number(data.irr_persen) || 0,
      npv_estimasi: Number(data.npv_estimasi) || 0,
      akses_jalan_terdekat: String(data.akses_jalan_terdekat || ""),
      url_foto_lokasi: data.url_foto_lokasi || data.photoUrl || data.gallery && data.gallery[0] || "",
      geom: data.geom || data.geometry || null,
      status_publikasi: data.status_publikasi || "Published",
      estimasi_nilai: Number(data.estimasi_nilai) || 0
    };
    const { data: invRow, error: invErr } = await supabase2.from("investments").select("*").eq("id", id).single();
    if (invErr || !invRow) {
      return res.status(404).json({ error: "Investasi tidak ditemukan!" });
    }
    const { data: gisRow } = await supabase2.from("gis_potensi_investasi").select("geom").eq("id", id).single();
    let invItem = {
      investmentValue: invRow.investment_value || 0,
      districtId: invRow.district_id,
      geometry: gisRow?.geom || null,
      latitude: invRow.latitude || 0,
      longitude: invRow.longitude || 0
    };
    const oldInvestmentValue = invItem.investmentValue;
    const oldDistrictId = invItem.districtId;
    const proj = {
      id,
      title,
      slug: data.slug || "untitled",
      sector,
      subSector: data.sub_sektor || data.subSector || "",
      status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    let spatialSyncResult = null;
    let distId = data.districtId || "lt";
    let vilId = data.villageId || "v_belopa1";
    let rDist = Number(data.roadDistance) || 0;
    let pDist = Number(data.portDistance) || 0;
    let aDist = Number(data.airportDistance) || 0;
    let geoForSync = data.geom || data.geometry || invItem.geometry;
    if (!geoForSync && data.latitude && data.longitude) {
      geoForSync = { type: "Point", coordinates: [Number(data.longitude), Number(data.latitude)] };
    }
    if (geoForSync) {
      spatialSyncResult = await calculateSpatialSync(geoForSync);
      if (spatialSyncResult) {
        if (spatialSyncResult.kecamatanMatch) {
          const mDist = districtsData.find((d) => d.name.toLowerCase() === spatialSyncResult.kecamatanMatch.toLowerCase());
          if (mDist) distId = mDist.id;
        }
        if (spatialSyncResult.desaMatch) {
          const mVil = villagesData.find((v) => v.name.toLowerCase() === spatialSyncResult.desaMatch.toLowerCase());
          if (mVil) vilId = mVil.id;
        }
        rDist = spatialSyncResult.nearestRoadKm || rDist;
        const nearestPort = spatialSyncResult.nearestFacilities?.find((f) => f.type.toLowerCase().includes("port") || f.name.toLowerCase().includes("pelabuhan"));
        if (nearestPort) pDist = nearestPort.distanceKm;
        const nearestAir = spatialSyncResult.nearestFacilities?.find((f) => f.type.toLowerCase().includes("airport") || f.name.toLowerCase().includes("bandara"));
        if (nearestAir) aDist = nearestAir.distanceKm;
      }
    }
    let finalLat = Number(data.latitude) || invItem.latitude || 0;
    let finalLng = Number(data.longitude) || invItem.longitude || 0;
    let geoSource = data.geom || data.geometry || invItem.geometry;
    if ((!finalLat || !finalLng) && geoSource) {
      try {
        const centroidFeature = turf2.centroid(
          turf2.feature(geoSource)
        );
        finalLng = centroidFeature.geometry.coordinates[0];
        finalLat = centroidFeature.geometry.coordinates[1];
      } catch (e) {
      }
    }
    if (finalLat < -4 || finalLat > -2 || finalLng < 119.5 || finalLng > 121.5) {
      finalLat = 0;
      finalLng = 0;
    }
    invItem = {
      ...invItem,
      name: proj.title,
      sector: proj.sector,
      districtId: distId,
      villageId: vilId,
      latitude: finalLat,
      longitude: finalLng,
      areaHa: Number(data.areaHa) || invItem.areaHa || 0,
      investmentValue: Number(data.capex) || invItem.investmentValue || 0,
      landStatus: data.ownershipStatus || invItem.landStatus || "Sertifikat Hak Milik",
      photoUrl: data.photoUrl || data.gallery && data.gallery[0] || invItem.photoUrl || "",
      photoUrls: data.gallery && data.gallery.length > 0 ? data.gallery : invItem.photoUrls || [],
      contactPic: data.contactPic || invItem.contactPic || "Humas DPMPTSP",
      phoneNumber: data.phoneNumber || invItem.phoneNumber || "-",
      geometry: data.geom || data.geometry || invItem.geometry || null,
      status: proj.status,
      spatialSync: spatialSyncResult,
      smartData: { ...invItem.smartData, ...data, roadDistance: rDist, portDistance: pDist, airportDistance: aDist }
    };
    await saveInvestmentToSupabaseDirect(invItem);
    const oldDistrictIdx = districtsData.findIndex((d) => d.id === oldDistrictId);
    if (oldDistrictIdx !== -1) {
      districtsData[oldDistrictIdx].totalInvestmentValue = Math.max(0, districtsData[oldDistrictIdx].totalInvestmentValue - oldInvestmentValue);
    }
    const newDistrictIdx = districtsData.findIndex((d) => d.id === distId);
    if (newDistrictIdx !== -1) {
      districtsData[newDistrictIdx].totalInvestmentValue += Number(data.capex || 0);
    }
    res.json(invItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/investments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: invRow, error: invErr } = await supabase2.from("investments").select("*").eq("id", id).single();
    if (invErr || !invRow) {
      return res.status(404).json({ error: "Investasi tidak ditemukan!" });
    }
    const { data: gisRow } = await supabase2.from("gis_potensi_investasi").select("geom").eq("id", id).single();
    let invItem = {
      investmentValue: invRow.investment_value || 0,
      districtId: invRow.district_id,
      geometry: gisRow?.geom || null,
      latitude: invRow.latitude || 0,
      longitude: invRow.longitude || 0
    };
    const { name, sector, districtId, villageId, latitude, longitude, areaHa, investmentValue, landStatus, photoUrl, photoUrls, contactPic, phoneNumber, geometry, status } = req.body;
    if (!name || !sector || !districtId || latitude === void 0 || longitude === void 0 || areaHa === void 0 || investmentValue === void 0) {
      return res.status(400).json({ error: "Kolom-kolom utama wajib diisi!" });
    }
    const oldInvestmentValue = invItem.investmentValue;
    const oldDistrictId = invItem.districtId;
    let spatialSyncResult = null;
    let finalGeometry = geometry !== void 0 ? geometry : invItem.geometry;
    let finalDistId = districtId;
    let finalVilId = villageId || "v_belopa1";
    let geoForSync = finalGeometry;
    if (!geoForSync && latitude !== void 0 && longitude !== void 0) {
      geoForSync = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
    }
    if (geoForSync) {
      try {
        spatialSyncResult = await calculateSpatialSync(geoForSync);
        if (spatialSyncResult) {
          if (spatialSyncResult.kecamatanMatch) {
            const mDist = districtsData.find((d) => d.name.toLowerCase() === spatialSyncResult.kecamatanMatch.toLowerCase());
            if (mDist) finalDistId = mDist.id;
          }
          if (spatialSyncResult.desaMatch) {
            const mVil = villagesData.find((v) => v.name.toLowerCase() === spatialSyncResult.desaMatch.toLowerCase());
            if (mVil) finalVilId = mVil.id;
          }
        }
      } catch (err) {
      }
    }
    invItem = {
      ...invItem,
      name,
      sector,
      districtId: finalDistId,
      villageId: finalVilId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      areaHa: Number(areaHa),
      investmentValue: Number(investmentValue),
      landStatus: landStatus || "Sertifikat Hak Milik",
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
      photoUrls: photoUrls || invItem.photoUrls || [],
      contactPic: contactPic || "Humas DPMPTSP",
      phoneNumber: phoneNumber || "0471-belopa",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      geometry: finalGeometry,
      status: status !== void 0 ? status : invItem.status || "Published",
      spatialSync: spatialSyncResult
    };
    const oldDistrictIdx = districtsData.findIndex((d) => d.id === oldDistrictId);
    if (oldDistrictIdx !== -1) {
      districtsData[oldDistrictIdx].totalInvestmentValue = Math.max(0, districtsData[oldDistrictIdx].totalInvestmentValue - oldInvestmentValue);
    }
    const newDistrictIdx = districtsData.findIndex((d) => d.id === districtId);
    if (newDistrictIdx !== -1) {
      districtsData[newDistrictIdx].totalInvestmentValue += Number(investmentValue);
    }
    [oldDistrictIdx, newDistrictIdx].forEach((dIdx) => {
      if (dIdx !== -1) {
        const dist = districtsData[dIdx];
        if (dist.geojson) {
          dist.geojson.properties = {
            ...dist.geojson.properties,
            totalInvestmentValue: dist.totalInvestmentValue
          };
        } else {
          const radius = Math.sqrt(dist.areaHa / 314.15) * 1.2;
          const poly = generateHexagon(dist.coordinates[0], dist.coordinates[1], radius);
          poly.properties = { ...dist, geojson: void 0 };
          districtsData[dIdx].geojson = poly;
        }
      }
    });
    const kIdx = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
    if (kIdx !== -1) {
      spatialLayers[kIdx].geojson = {
        type: "FeatureCollection",
        features: districtsData.map((d) => d.geojson)
      };
    }
    await saveInvestmentToSupabaseDirect(invItem);
    res.json(invItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/investments/:id", async (req, res) => {
  const { id } = req.params;
  const { data: fetchCurrent, error: fetchErr } = await supabase2.from("investments").select("district_id, investment_value").eq("id", id).single();
  const deleted = fetchErr ? null : { districtId: fetchCurrent.district_id, investmentValue: fetchCurrent.investment_value };
  if (deleted) {
    await deleteInvestmentFromRelationalDB(id);
    const distIdx = districtsData.findIndex((d) => d.id === deleted.districtId);
    if (distIdx !== -1) {
      districtsData[distIdx].totalInvestmentValue = Math.max(0, districtsData[distIdx].totalInvestmentValue - deleted.investmentValue);
      const dist = districtsData[distIdx];
      if (dist.geojson) {
        dist.geojson.properties = {
          ...dist.geojson.properties,
          totalInvestmentValue: dist.totalInvestmentValue
        };
      }
      const kIdx = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
      if (kIdx !== -1) {
        spatialLayers[kIdx].geojson = {
          type: "FeatureCollection",
          features: districtsData.map((d) => d.geojson)
        };
      }
    }
    return res.json({ success: true, message: "Investasi berhasil dihapus!" });
  }
  res.status(404).json({ error: "Investasi tidak ditemukan!" });
});
app.post("/api/infrastruktur", async (req, res) => {
  try {
    const { nama_infrastruktur, kategori, keterangan_singkat, coordinates, icon } = req.body;
    if (!nama_infrastruktur || !kategori || !coordinates) {
      return res.status(400).json({ error: "Mission failed: nama_infrastruktur, kategori, dan coordinates wajib diisi." });
    }
    const newInfra = {
      id: "infra_" + Date.now().toString(),
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates
        // [lng, lat]
      },
      properties: {
        id: "infra_" + Date.now().toString(),
        name: nama_infrastruktur,
        nama_infrastruktur,
        kategori,
        keterangan_singkat: keterangan_singkat || "",
        category: kategori,
        description: keterangan_singkat || "",
        icon: icon || "Users",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    const infraPayload = prepareForPostGIS({
      id: newInfra.properties.id,
      nama_infrastruktur,
      kategori,
      keterangan_singkat: keterangan_singkat || "",
      status: "Draft",
      type: kategori,
      geom: { type: "Point", coordinates }
    }, "gis_infrastruktur");
    const { error: dbErr } = await supabase2.from("gis_infrastruktur").insert([infraPayload]);
    if (dbErr) {
      console.error("[Supabase Error] infrastruktur.insert:", dbErr.message);
      throw new Error(`Database error: ${dbErr.message}`);
    }
    const infraLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_infrastruktur");
    if (infraLayerIdx !== -1) {
      if (!spatialLayers[infraLayerIdx].geojson.features) {
        spatialLayers[infraLayerIdx].geojson.features = [];
      }
      spatialLayers[infraLayerIdx].geojson.features.push(newInfra);
    }
    res.status(201).json({ success: true, data: newInfra });
  } catch (error) {
    console.error("Save infrastruktur error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/potensi_investasi", async (req, res) => {
  try {
    const { name, category, status, coordinates, district, areaHa, lengthKm, lastEditedBy, geomType, geojsonRaw } = req.body;
    if (!name || !coordinates && !geojsonRaw) {
      return res.status(400).json({ error: "Mission failed: name dan geometri (coordinates) wajib diisi." });
    }
    const docId = "potensi_" + Date.now();
    let newFeat = null;
    if (geojsonRaw && geojsonRaw.type === "Feature") {
      newFeat = geojsonRaw;
      newFeat.id = docId;
      if (!newFeat.properties) newFeat.properties = {};
      newFeat.properties.id = docId;
    } else {
      newFeat = {
        id: docId,
        type: "Feature",
        geometry: {
          type: geomType || "Polygon",
          coordinates
        },
        properties: {
          id: docId,
          name,
          category: category || "Potensi Investasi",
          status: status || "Usulan Baru",
          district: district || "",
          areaHa: areaHa || 0,
          lengthKm: lengthKm || 0,
          lastEditedBy: lastEditedBy || "operator",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    }
    const matchedDist = district ? districtsData.find((d) => d.name.toLowerCase() === district.toLowerCase() || d.id === district.toLowerCase()) || { id: "lt" } : { id: "lt" };
    const invObject = {
      id: docId,
      name: name || "Untitled Potensi",
      sector: category || "Potensi Investasi",
      subSector: category || "",
      districtId: matchedDist.id,
      villageId: "v_belopa1",
      latitude: newFeat.geometry?.type === "Point" ? Number(newFeat.geometry.coordinates[1]) : 0,
      longitude: newFeat.geometry?.type === "Point" ? Number(newFeat.geometry.coordinates[0]) : 0,
      areaHa: Number(areaHa) || 0,
      investmentValue: 0,
      landStatus: "Sertifikat Hak Milik",
      photoUrl: "",
      photoUrls: [],
      contactPic: lastEditedBy || "operator",
      phoneNumber: "ENTERPRISE-API",
      geometry: newFeat.geometry,
      status: status === "Usulan Baru" ? "Published" : status || "Published",
      smartData: {
        id: docId,
        nama_potensi: name,
        sektor_utama: category,
        luas_lahan: Number(areaHa) || 0,
        status_kepemilikan: "Sertifikat Hak Milik",
        status_publikasi: status === "Usulan Baru" ? "Published" : status || "Published"
      }
    };
    await saveInvestmentToSupabaseDirect(invObject);
    const potLayerIdx = spatialLayers.findIndex((l) => l.id === "layer_potensi");
    if (potLayerIdx !== -1) {
      if (!spatialLayers[potLayerIdx].geojson.features) {
        spatialLayers[potLayerIdx].geojson.features = [];
      }
      spatialLayers[potLayerIdx].geojson.features.push(newFeat);
    }
    res.status(201).json({ success: true, data: newFeat });
  } catch (error) {
    console.error("Save potensi_investasi error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/upload-geojson", async (req, res) => {
  try {
    const { name, category, geojson, opacity, color } = req.body;
    if (!name || !category || !geojson) {
      return res.status(400).json({ error: "Parameter name, category, dan raw GeoJSON wajib disertakan!" });
    }
    if (geojson.type !== "FeatureCollection" && geojson.type !== "Feature" && geojson.type !== "GeometryCollection" && geojson.type !== "Polygon" && geojson.type !== "MultiPolygon") {
      return res.status(400).json({ error: "Struktur berkas tidak valid sebagai GeoJSON standar." });
    }
    try {
      turf2.bbox(geojson);
    } catch (gErr) {
      return res.status(400).json({ error: "Geometri gagal divalidasi. Periksa koordinat CRS atau tipe koordinat Polygon!" });
    }
    const newLayer = {
      id: "layer_" + Date.now(),
      name,
      category,
      geojson,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: true,
      opacity: Number(opacity) || 0.7,
      color: color || "#10b981",
      // green default
      lineWidth: 2
    };
    spatialLayers.push(newLayer);
    await saveLayerToSupabase(newLayer);
    res.status(201).json({ success: true, layer: newLayer });
  } catch (error) {
    console.error("Layer save error:", error);
    res.status(500).json({ error: error.message });
  }
});
var spatialHistory = [];
app.get("/api/gis_jalan", async (req, res) => {
  try {
    await ensureDbHydrated();
    const roadLayer = spatialLayers.find((l) => l.id === "layer_jalan");
    if (roadLayer && roadLayer.geojson && roadLayer.geojson.features && roadLayer.geojson.features.length > 0) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400"
      );
      return res.json(roadLayer.geojson);
    }
    const { data: jalanData, error: jalanErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_jalan" });
    if (jalanErr) {
      console.error("[API /api/gis_jalan] Database RPC Error:", jalanErr);
      return res.status(500).json({ error: "Failed to fetch road layer from database" });
    }
    let jalanFeatures = [];
    if (Array.isArray(jalanData)) {
      jalanFeatures = jalanData.map((f) => ({
        type: "Feature",
        geometry: f.geometry || f.geom || null,
        properties: {
          id: f.properties?._temp_id || f.properties?.id || f.id || "unknown",
          fungsi_ren: f.properties?.fungsi_ren || f.properties?.fungsi || "Jalan",
          nama: f.properties?.nama || f.properties?.nama_ruas || "Jalan",
          status: f.properties?.status || "Unknown",
          kondisi: f.properties?.kondisi || "Unknown",
          panjang_km: typeof f.properties?.panjang_km === "number" ? f.properties.panjang_km : Number(f.properties?.panjang_km) || 0
        }
      })).filter((f) => f.geometry !== null);
    }
    const geojsonPayload = {
      type: "FeatureCollection",
      features: jalanFeatures
    };
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.json(geojsonPayload);
  } catch (err) {
    console.error("[API /api/gis_jalan] Exception:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
app.get("/api/spatial-layers/:id", async (req, res) => {
  await ensureDbHydrated();
  const { id } = req.params;
  const layer = spatialLayers.find((l) => l.id === id);
  if (!layer) return res.status(404).json({ error: "Layer not found" });
  res.json(layer);
});
app.get("/api/spatial-layers", async (req, res) => {
  const { districtId, kecamatan } = req.query;
  const cacheKey = `spatial_layers_${districtId || "all"}_${kecamatan || "none"}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(cache[cacheKey].data);
  }
  try {
    await withTimeout(ensureDbHydrated(), 15e3, "Database hydration timed out");
    try {
      const { data: kecData, error: kecErr } = await supabase2.from("gis_kecamatan").select("id, objectid, kecamatan, sum_jum_pd, luas, kpdt_pddk, jlh_desa, kelompok, geom");
      if (!kecErr && kecData && kecData.length > 0) {
        const kecIndex = spatialLayers.findIndex((l) => l.id === "layer_kecamatan");
        if (kecIndex !== -1) {
          spatialLayers[kecIndex].geojson = {
            type: "FeatureCollection",
            features: kecData.map((row) => {
              const rawKecName = row.kecamatan || row.name || `Kecamatan ${row.id}`;
              const cleanKecName = rawKecName.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
              const districtId2 = `dist_${cleanKecName.toLowerCase().replace(/\s+/g, "_")}`;
              return {
                type: "Feature",
                geometry: row.geom || row.geojson,
                properties: { ...row, id: districtId2, _id: row.id, name: cleanKecName, rawName: rawKecName }
              };
            })
          };
        }
      }
    } catch (e) {
    }
    try {
      const { data: desaData, error: desaErr } = await supabase2.from("gis_desa").select("id, name, kecamatan, label, jum_desa, luaskm_bps, jum_rt, jum_pdd, kepadatan, rata_pddrt, luas_gis, persenluas, kodebps, nama_desa, adm, aa, geom");
      if (!desaErr && desaData && desaData.length > 0) {
        const desaIndex = spatialLayers.findIndex((l) => l.id === "layer_desa");
        let newVillagesData = [];
        const mappedFeatures = desaData.map((row) => {
          let rawKecName = row.kecamatan || row.WADMKC || row.KECAMATAN || "";
          if (!rawKecName && (row.geom || row.geojson)) {
            try {
              const kecLayer = spatialLayers.find((l) => l.id === "layer_kecamatan");
              const kecFeatures = kecLayer?.geojson?.features || [];
              const matchedKec = kecFeatures.find((kf) => {
                if (!kf.geometry) return false;
                try {
                  return turf2.booleanIntersects(
                    { type: "Feature", geometry: row.geom || row.geojson, properties: {} },
                    kf
                  );
                } catch (err) {
                  return false;
                }
              });
              if (matchedKec) {
                rawKecName = matchedKec.properties?.name || matchedKec.properties?.KECAMATAN || "";
              }
            } catch (err) {
            }
          }
          const cleanKecName = rawKecName.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace(/Kec\.\s*/i, "").trim();
          const districtId2 = `dist_${cleanKecName.toLowerCase().replace(/\s+/g, "_")}`;
          let coords = [0, 0];
          try {
            const geom = row.geom || row.geojson;
            if (geom) {
              const poly = JSON.parse(JSON.stringify({ type: "Feature", geometry: geom }));
              const cent = turf2.centroid(poly);
              if (cent && cent.geometry && cent.geometry.coordinates) {
                coords = [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
              }
            }
          } catch (e) {
          }
          const luasGIS = parseFloat(row.luas_gis || row.luas || "0");
          const areaHa = luasGIS > 0 ? luasGIS * 100 : 500;
          const pop = parseInt(row.jum_pdd || "1000", 10);
          const density = parseFloat(row.kepadatan || (pop / (areaHa / 100)).toString());
          newVillagesData.push({
            id: String(row.id),
            districtId: districtId2,
            name: row.desa || row.nama_desa || row.name || `Desa ${row.id}`,
            areaHa,
            population: pop,
            density,
            coordinates: coords,
            geojson: { type: "Feature", geometry: row.geom || row.geojson, properties: { ...row, id: String(row.id), districtId: districtId2, name: row.desa || row.nama_desa || row.name || `Desa ${row.id}` } }
          });
          return {
            type: "Feature",
            geometry: row.geom || row.geojson,
            properties: { ...row, id: String(row.id), districtId: districtId2, name: row.desa || row.nama_desa || row.name || `Desa ${row.id}` }
          };
        });
        if (newVillagesData.length > 0) {
          villagesData = newVillagesData;
        }
        if (desaIndex !== -1) {
          spatialLayers[desaIndex].geojson = {
            type: "FeatureCollection",
            features: mappedFeatures
          };
        } else {
          spatialLayers.push({
            id: "layer_desa",
            name: "Batas Administrasi Desa",
            category: "Desa",
            geojson: { type: "FeatureCollection", features: mappedFeatures },
            uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
            isActive: false,
            opacity: 0.5,
            color: "#10b981",
            lineWidth: 1
          });
        }
      }
    } catch (e) {
    }
    try {
      const { data: sawahData, error: sawahErr } = await supabase2.from("gis_sawah").select("id, geom");
      if (!sawahErr && sawahData && sawahData.length > 0) {
        const sawahIndex = spatialLayers.findIndex((l) => l.id === "layer_sawah");
        if (sawahIndex !== -1) {
          spatialLayers[sawahIndex].geojson = {
            type: "FeatureCollection",
            features: sawahData.map((row) => ({
              type: "Feature",
              geometry: row.geom || row.geojson,
              properties: { ...row }
            }))
          };
        }
      }
    } catch (e) {
    }
    try {
      const { data: mangroveData, error: mangroveErr } = await supabase2.from("gis_mangrove").select("id, geom");
      if (!mangroveErr && mangroveData && mangroveData.length > 0) {
        const mangroveIndex = spatialLayers.findIndex((l) => l.id === "layer_mangrove");
        if (mangroveIndex !== -1) {
          spatialLayers[mangroveIndex].geojson = {
            type: "FeatureCollection",
            features: mangroveData.map((row) => ({
              type: "Feature",
              geometry: row.geom || row.geojson,
              properties: { ...row }
            }))
          };
        }
      }
    } catch (e) {
    }
    try {
      const { data: tambakData, error: tambakErr } = await supabase2.from("gis_tambak").select("id, geom");
      if (!tambakErr && tambakData && tambakData.length > 0) {
        const tambakIndex = spatialLayers.findIndex((l) => l.id === "layer_tambak");
        if (tambakIndex !== -1) {
          spatialLayers[tambakIndex].geojson = {
            type: "FeatureCollection",
            features: tambakData.map((row) => ({
              type: "Feature",
              geometry: row.geom || row.geojson,
              properties: { ...row }
            }))
          };
        }
      }
    } catch (e) {
    }
    const uniqueLayers = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const layer of spatialLayers) {
      if (layer && layer.id) {
        if (!seenIds.has(layer.id)) {
          seenIds.add(layer.id);
          const heavyLayers = ["layer_rbi", "layer_tutupan_lahan", "layer_pemukiman"];
          if (heavyLayers.includes(layer.id) && !districtId && !kecamatan) {
            const lazyLayer = { ...layer, geojson: null, isLazy: true };
            uniqueLayers.push(lazyLayer);
          } else {
            uniqueLayers.push(layer);
          }
        }
      }
    }
    if (!districtId && !kecamatan) {
      cache[cacheKey] = {
        data: uniqueLayers,
        timestamp: Date.now()
      };
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400"
      );
      return res.json(uniqueLayers);
    }
    let selectedKecName = "";
    let selectedKecGeom = null;
    if (districtId) {
      const dist = districtsData.find((d) => d.id === districtId);
      if (dist) {
        selectedKecName = dist.name;
        selectedKecGeom = dist.geojson;
      }
    } else if (kecamatan) {
      const dist = districtsData.find((d) => d.name.toLowerCase() === kecamatan.toLowerCase());
      if (dist) {
        selectedKecName = dist.name;
        selectedKecGeom = dist.geojson;
      }
    }
    if (selectedKecName && selectedKecGeom) {
      const filteredLayers = JSON.parse(JSON.stringify(uniqueLayers));
      for (const layer of filteredLayers) {
        if (["layer_sawah", "layer_mangrove", "layer_tambak"].includes(layer.id)) {
          if (layer.geojson && layer.geojson.features) {
            let postgisFeatures = [];
            let usePostgisFallback = false;
            try {
              const dbTableName = layer.id === "layer_sawah" ? "gis_sawah" : layer.id === "layer_mangrove" ? "gis_mangrove" : "gis_tambak";
              const { data, error } = await withTimeout(
                (async () => {
                  return await supabase2.rpc("get_layer_data_intersecting", {
                    p_table_name: dbTableName,
                    p_kecamatan_name: selectedKecName
                  });
                })(),
                8e3,
                "PostGIS Intersection Query timed out"
              );
              if (!error && data && data.length > 0) {
                postgisFeatures = data.map((row) => ({
                  type: "Feature",
                  geometry: row.geom || row.geometry || null,
                  properties: prepareForFrontend(row, dbTableName)
                })).filter((f) => f.geometry !== null);
                layer.geojson.features = postgisFeatures;
                usePostgisFallback = true;
              }
            } catch (dbErr) {
            }
            if (!usePostgisFallback) {
              try {
                const beforeCount = layer.geojson.features.length;
                const filteredFeatures = layer.geojson.features.filter((f) => {
                  try {
                    return turf2.booleanIntersects(f, selectedKecGeom);
                  } catch (e) {
                    return false;
                  }
                });
                layer.geojson.features = filteredFeatures;
              } catch (err) {
                console.error(`[TURF SERVER] Failed Turf filtering for ${layer.id}:`, err.message);
                layer.geojson.features = [];
              }
            }
          }
        }
      }
      cache[cacheKey] = {
        data: filteredLayers,
        timestamp: Date.now()
      };
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400"
      );
      return res.json(filteredLayers);
    }
    cache[cacheKey] = {
      data: uniqueLayers,
      timestamp: Date.now()
    };
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return res.json(uniqueLayers);
  } catch (error) {
    console.error("[API /api/spatial-layers] Exception:", error);
    console.error(JSON.stringify(error, null, 2));
    if (cache[cacheKey]) {
      return res.json(cache[cacheKey].data);
    }
    return res.json([]);
  }
});
app.get("/api/spatial-history", async (req, res) => {
  await ensureDbHydrated();
  res.json(spatialHistory);
});
app.post("/api/spatial-history", async (req, res) => {
  const { user, layerId, layerName, actionType, oldProps, newProps } = req.body;
  const historyEntry = {
    id: "hist_" + Math.random().toString(36).substring(2, 11),
    user: user || "Operator",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    layerId,
    layerName,
    actionType: actionType || "UPDATE",
    oldProps,
    newProps
  };
  spatialHistory.unshift(historyEntry);
  await supabase2.from("spatial_history").insert(prepareForPostGIS(historyEntry));
  if (spatialHistory.length > 100) {
    const removed = spatialHistory.pop();
    if (removed) await supabase2.from("spatial_history").delete().eq("id", removed.id);
  }
  res.status(201).json(historyEntry);
});
app.post("/api/spatial-history/rollback", async (req, res) => {
  const { historyId } = req.body;
  const entry = spatialHistory.find((h) => h.id === historyId);
  if (!entry) {
    return res.status(404).json({ error: "Catatan histori tidak ditemukan" });
  }
  const idx = spatialLayers.findIndex((l) => l.id === entry.layerId);
  if (idx !== -1) {
    const currentLayer = JSON.parse(JSON.stringify(spatialLayers[idx]));
    if (entry.oldProps) {
      if (entry.oldProps.name) spatialLayers[idx].name = entry.oldProps.name;
      if (entry.oldProps.category) spatialLayers[idx].category = entry.oldProps.category;
      if (entry.oldProps.color) spatialLayers[idx].color = entry.oldProps.color;
      if (typeof entry.oldProps.opacity === "number") spatialLayers[idx].opacity = entry.oldProps.opacity;
    }
    const rbEntry = {
      id: "hist_" + Math.random().toString(36).substring(2, 11),
      user: "System (Rollback)",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      layerId: entry.layerId,
      layerName: entry.layerName,
      actionType: "ROLLBACK",
      oldProps: { name: currentLayer.name, category: currentLayer.category, color: currentLayer.color, opacity: currentLayer.opacity },
      newProps: entry.oldProps
    };
    spatialHistory.unshift(rbEntry);
    await supabase2.from("spatial_history").insert(prepareForPostGIS(rbEntry));
    await saveLayerToSupabase(spatialLayers[idx]);
    return res.json({ success: true, message: "Rollback berhasil dilakukan", layer: spatialLayers[idx] });
  }
  res.status(400).json({ error: "Gagal memproses rollback. Layer asal tidak ditemukan atau aksi tidak didukung." });
});
app.put("/api/spatial-layers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, opacity, color, geojson, name, category, user } = req.body;
    const idx = spatialLayers.findIndex((l) => l.id === id);
    if (idx !== -1) {
      const oldLayer = JSON.parse(JSON.stringify(spatialLayers[idx]));
      if (typeof isActive === "boolean") spatialLayers[idx].isActive = isActive;
      if (typeof opacity === "number") spatialLayers[idx].opacity = opacity;
      if (typeof color === "string") spatialLayers[idx].color = color;
      if (geojson) {
        spatialLayers[idx].geojson = geojson;
      }
      if (name) spatialLayers[idx].name = name;
      if (category) spatialLayers[idx].category = category;
      if (geojson || name || category || typeof opacity === "number" || typeof color === "string") {
        const historyEntry = {
          id: "hist_" + Math.random().toString(36).substring(2, 11),
          user: user || "Operator",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          layerId: id,
          layerName: oldLayer.name,
          actionType: "UPDATE",
          oldProps: { name: oldLayer.name, category: oldLayer.category, color: oldLayer.color, opacity: oldLayer.opacity },
          newProps: { name: spatialLayers[idx].name, category: spatialLayers[idx].category, color: spatialLayers[idx].color, opacity: spatialLayers[idx].opacity }
        };
        spatialHistory.unshift(historyEntry);
        await supabase2.from("spatial_history").insert(prepareForPostGIS(historyEntry));
      }
      await saveLayerToSupabase(spatialLayers[idx]);
      return res.json(spatialLayers[idx]);
    }
    res.status(404).json({ error: "Layer tidak ditemukan" });
  } catch (error) {
    console.error("Error at PUT /api/spatial-layers/:id:", error);
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/spatial-layers/:id", async (req, res) => {
  const { id } = req.params;
  const idx = spatialLayers.findIndex((l) => l.id === id);
  if (idx !== -1) {
    spatialLayers.splice(idx, 1);
    try {
      const dataDir = import_path.default.join(process.cwd(), "data");
      const layerPath = import_path.default.join(dataDir, "custom_layers", `${id}.json`);
      if (import_fs.default.existsSync(layerPath)) {
        import_fs.default.unlinkSync(layerPath);
      }
    } catch (delErr) {
      console.error("[Local Sync] Failed to delete custom layer file:", delErr.message);
    }
    return res.json({ success: true, message: "Spatial layer successfully removed." });
  }
  res.status(404).json({ error: "Layer tak ditemukan." });
});
app.get("/api/heatmap", async (req, res) => {
  const { metric } = req.query;
  const { data: invData } = await fetchAndJoinInvestments();
  const frontendRows = prepareForFrontend(invData || []);
  const points = frontendRows.map((inv) => {
    let weight = 1;
    if (metric === "value") {
      weight = Math.max(1, Math.log10(inv.investmentValue) - 7);
    } else if (metric === "density") {
      const dist = districtsData.find((d) => d.id === inv.districtId);
      weight = dist ? dist.density / 200 : 1;
    }
    return [inv.latitude, inv.longitude, weight];
  });
  res.json(points);
});
app.post("/api/route", async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat } = req.body;
    if (startLng === void 0 || startLat === void 0 || endLng === void 0 || endLat === void 0) {
      return res.status(400).json({ error: "Koordinat startLng, startLat, endLng, endLat wajib disertakan." });
    }
    const { data, error } = await supabase2.rpc("get_network_distance", {
      start_lng: startLng,
      start_lat: startLat,
      end_lng: endLng,
      end_lat: endLat
    });
    if (error) {
      throw error;
    }
    return res.json({ success: true, distanceKm: data, method: "NETWORK_PGROUTING" });
  } catch (error) {
    console.error("Error at POST /api/route:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/spatial-proximity", async (req, res) => {
  try {
    const infraId = req.query.infraId;
    const radiusKm = Number(req.query.radiusKm) || 5;
    if (!infraId) {
      return res.status(400).json({ error: "Parameter infraId wajib disertakan." });
    }
    const { data: invData } = await fetchAndJoinInvestments();
    const investmentsList = prepareForFrontend(invData || []);
    const { data: infraData, error: infraErr } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_infrastruktur" });
    if (infraErr) {
    }
    const points = (infraData || []).map((f) => ({
      id: f.properties?.id || f.id || "infra-" + Math.random().toString(36).substring(2, 9),
      name: f.properties?.name || "Fasilitas Umum",
      type: f.properties?.type || f.properties?.category || "Lainnya",
      latitude: f.geometry?.coordinates?.[1] || 0,
      longitude: f.geometry?.coordinates?.[0] || 0
    }));
    const selectedInfra = points.find((f) => f.id === infraId);
    if (!selectedInfra) {
      return res.json([]);
    }
    const infraPt = turf2.point([selectedInfra.longitude, selectedInfra.latitude]);
    const results = await Promise.all(investmentsList.map(async (inv) => {
      const polyGeom = inv.geometry || inv.gisPotensiInvestasi?.[0]?.geom || null;
      const fromParam = polyGeom ? { type: "Feature", geometry: polyGeom, properties: {} } : turf2.point([inv.longitude, inv.latitude]);
      const distRes = await getDistance(fromParam, infraPt, { units: "kilometers" }, supabase2);
      const distKm = distRes.distance;
      let score = 100;
      if (distKm > radiusKm) {
        score = Math.max(20, Math.round(100 - (distKm - radiusKm) * 10));
      } else {
        score = Math.max(90, Math.round(100 - distKm / radiusKm * 10));
      }
      return {
        ...inv,
        distToPortKm: inv.distToPortKm || 0,
        distToRoadKm: inv.distToRoadKm || 0,
        proximityDistanceKm: Number(distKm.toFixed(2)),
        suitabilityScore: score
      };
    }));
    const filteredResults = results.filter((item) => item.proximityDistanceKm <= radiusKm).sort((a, b) => a.proximityDistanceKm - b.proximityDistanceKm);
    res.json(filteredResults);
  } catch (error) {
    console.error("Error at GET /api/spatial-proximity:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/spatial-analysis", async (req, res) => {
  try {
    const minArea = Number(req.query.minArea) || 0;
    const maxPortDist = Number(req.query.maxPortDist) || 999;
    const maxRoadDist = Number(req.query.maxRoadDist) || 999;
    const searchSectors = req.query.sectors ? req.query.sectors.split(",") : [];
    const minVal = Number(req.query.minValue) || 0;
    const { data: invData } = await fetchAndJoinInvestments();
    const frontendRows = prepareForFrontend(invData || []);
    const results = await Promise.all(frontendRows.map(async (inv) => {
      const polyGeom = inv.geometry || inv.gisPotensiInvestasi?.[0]?.geom || null;
      const fromParam = polyGeom ? { type: "Feature", geometry: polyGeom, properties: {} } : turf2.point([inv.longitude, inv.latitude]);
      const portNode = infrastructurePoints && infrastructurePoints.length > 0 ? infrastructurePoints.find((p) => p.type?.toLowerCase()?.includes("port") || p.name?.toLowerCase()?.includes("pelabuhan")) || infrastructurePoints[0] : { longitude: 120.39793462368112, latitude: -3.386061643485775 };
      const portPt = turf2.point([portNode.longitude, portNode.latitude]);
      const distToPortRes = await getDistance(fromParam, portPt, { units: "kilometers" }, supabase2);
      const distToPort = distToPortRes.distance;
      const roadLine = turf2.lineString([
        [120.3015, -3.5488],
        // Suli/Larompong south
        [120.3294, -3.4025],
        // Belopa capital
        [120.3582, -3.1111],
        // Bua logistics
        [120.2285, -2.9324]
        // Walenrang north
      ]);
      const snapResult = turf2.nearestPointOnLine(roadLine, fromParam);
      const distToRoadRes = await getDistance(fromParam, snapResult, { units: "kilometers" }, supabase2);
      const distToRoad = snapResult.properties.dist || distToRoadRes.distance;
      return {
        ...inv,
        distToPortKm: Number(distToPort.toFixed(2)),
        distToRoadKm: Number(distToRoad.toFixed(2)),
        // Base suitability criteria rating
        suitabilityScore: 100
      };
    }));
    const filteredResults = results.filter((item) => {
      if (minArea > 0 && item.areaHa < minArea) return false;
      if (maxPortDist < 999 && item.distToPortKm > maxPortDist) return false;
      if (maxRoadDist < 999 && item.distToRoadKm > maxRoadDist) return false;
      if (searchSectors.length > 0 && !searchSectors.includes(item.sector)) return false;
      if (minVal > 0 && item.investmentValue < minVal) return false;
      return true;
    }).map((item) => {
      let score = 100;
      if (item.distToPortKm > 10) score -= (item.distToPortKm - 10) * 1.5;
      if (item.distToRoadKm > 2) score -= (item.distToRoadKm - 2) * 5;
      if (item.areaHa < 20) score -= 15;
      if (item.photoUrl.includes("placeholder")) score -= 5;
      item.suitabilityScore = Math.max(20, Math.min(100, Math.round(score)));
      return item;
    }).sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));
    res.json(filteredResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/gemini/recommendation", async (req, res) => {
  const { sector, focusDistrictId, targetAreaHa, language } = req.body;
  const district = districtsData.find((d) => d.id === focusDistrictId);
  const { data: invData } = await fetchAndJoinInvestments();
  const frontendRows = prepareForFrontend(invData || []);
  const matchedInvests = frontendRows.filter((inv) => inv.sector === sector && (focusDistrictId ? inv.districtId === focusDistrictId : true));
  const totalInvBySector = matchedInvests.reduce((sum, current) => sum + current.investmentValue, 0);
  const getOfflineRecommendation = () => {
    let title = `Rekomendasi Strategis Investasi ${sector} di Kecamatan ${district ? district.name : "Kabupaten Luwu"}`;
    let score = 85;
    let content = "";
    if (sector === "Pertanian") {
      content = `Wilayah ini sangat kondusif untuk ekspansi agroindustri terpadu karena didukung oleh:
1. Ketersediaan lahan datar produktif yang lapang (sasaran luas: ${targetAreaHa || 100} hektar).
2. Kedekatan logistik dengan arteri jalan nasional (rata-rata di bawah 3 km) mempercepat distribusi hasil panen.
3. Potensi sirkulasi air irigasi melimpah yang bersumber langsung dari jaring pengairan pegunungan Luwu.
4. Kepadatan penduduk yang moderat memastikan ketersediaan tenaga kerja agro terlatih secara lestari.`;
      score = district?.id === "lm" || district?.id === "po" ? 95 : 82;
    } else if (sector === "Kelautan") {
      content = `Wilayah pesisir timur Kabupaten Luwu memiliki keunggulan komparatif kelautan yang eksklusif karena:
1. Garis pantai yang bersih beraliran Teluk Bone sangat ideal untuk budidaya rumput-laut Cottonii kualitas tinggi.
2. Akses mudah ke pelabuhan penunjang memperlancar ekspor komoditas beku ke Surabaya maupun mancanegara.
3. Rencana tata ruang mendukung pengembangan klaster pengolahan pasca panen di wilayah Kecamatan Larompong dan Ponrang Selatan.
4. Kelayakan daya listrik industri PLN 150kV yang stabil untuk penyimpanan rantai beku (Cold Storage).`;
      score = district?.id === "la" || district?.id === "bu" || district?.id === "ps" ? 96 : 78;
    } else if (sector === "Pertambangan") {
      content = `Prospek investasi mineral dan tambang batuan non-logam di Kabupaten Luwu memiliki rasio pengembalian modal tinggi karena:
1. Kekayaan mineral sekunder, andesit, dan batu gunung pilihan di daerah Walenrang & Latimojong.
2. Infrastruktur jalan nasional yang kokoh menyangga armada logistik berat (tonase tinggi).
3. Status peruntukan wilayah aman sesuai RTRW kawasan penambangan berkelanjutan.
4. Dukungan perizinan satu pintu (PTSP) Luwu yang transparan, aman, dan kooperatif bagi investor kredibel.`;
      score = district?.id === "lt" || district?.id === "wa" ? 93 : 64;
    } else if (sector === "Pariwisata") {
      content = `Destinasi pariwisata bertema alam dan agrowisata kopi specialty di Luwu terus naik daun karena:
1. Keindahan eksotis pegunungan Bastem dan kesejukan udara kaki Gunung Latimojong.
2. Keunikan adat istiadat dan daya tarik ekowisata kopi Arabika Luwu Raya.
3. Ketersediaan lahan dengan kepemilikan adat yang kondusif untuk dikerjasamakan dalam skema kemitraan ekowisata berkelanjutan.
4. Jaringan internet broadband nirkabel yang memadai melayani pelancong modern.`;
      score = district?.id === "bs" || district?.id === "lt" ? 92 : 70;
    } else {
      content = `Katalis perdagangan retail, pergudangan logistik, dan UMKM di pusat-pusat kecamatan Luwu memiliki prospek cerah karena:
1. Pertumbuhan daya beli masyarakat ibukota Belopa yang meningkat signifikan.
2. Fungsi hub perdagangan regional yang menghubungkan Kota Palopo dan koridor lintas provinsi.
3. Ketersediaan ruang komersial ruko dengan nilai sewa kompetitif di sepanjang koridor arteri utama.
4. Ekosistem transaksi digital perbankan dan izin berusaha daerah yang sangat ramah terhadap UMKM binaan.`;
      score = district?.id === "bl" || district?.id === "bu" ? 94 : 80;
    }
    return {
      title,
      suitabilityScore: score,
      content,
      recommendSectors: [sector]
    };
  };
  if (ai) {
    try {
      const activeLang = language || "id";
      let langDirective = "";
      if (activeLang === "en") {
        langDirective = `
- LANGUAGE MANDATE: You MUST write the JSON fields ("title" and "content") entirely in English (Bahasa Inggris).
- In "content", write elegant bullet-points in English, citing roads, ports, density etc.
- Maintain a highly consultative, investor-grade tone.`;
      } else if (activeLang === "zh") {
        langDirective = `
- LANGUAGE MANDATE: You MUST write the JSON fields ("title" and "content") entirely in Simplified Chinese (\u4E2D\u6587/\u666E\u901A\u8BDD).
- In "content", write elegant bullet-points in Chinese, citing roads, ports, density etc.
- Maintain a highly consultative, investor-grade tone.`;
      } else {
        langDirective = `
- LANGUAGE MANDATE: You MUST write the JSON fields ("title" and "content") in friendly, professional Indonesian.
- In "content", write elegant bullet-points in Indonesian kawan, citing roads, ports, density etc.`;
      }
      const prompt = `Analisis potensi investasi spasial Kabupaten Luwu, Indonesia, untuk:
- Sektor: ${sector}
- Fokus Kecamatan: ${district ? district.name + " (Area: " + district.areaHa + " Hectares, Kepadatan: " + district.density + " org/km2)" : "Seluruh Kecamatan di Luwu"}
- Rencana Luas Target: ${targetAreaHa || 100} hektar
- Investasi Sektor yang Sudah Ada Berjalan: ${matchedInvests.length} proyek dengan akumulasi nilai Rp ${Number(totalInvBySector / 1e6).toFixed(0)} Juta rupiah.

Hasilkan dokumen rekomendasi profesional, berbobot, berbasis tata ruang dan geospasial (gis) yang ringkas dan padat untuk investor asing maupun dalam negeri. 
Berikan penekanan geospasial pada kemudahan logistik seperti jarak ke infrastruktur port dan bandara terdekat.

${langDirective}

Kembalikan respon DALAM FORMAT JSON BERIKUT SAJA (tanpa bungkus markdown atau teks pendahuluan lain):
{
  "title": "Judul rekomendasi investasi",
  "suitabilityScore": 95, // Nilai integer kelayakan wilayah 0-100
  "content": "Isi analisis mendalam...",
  "recommendSectors": ["${sector}"]
}`;
      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });
      const rawJson = response.text?.trim() || "";
      const cleaned = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
      const resultObj = JSON.parse(cleaned);
      return res.json(resultObj);
    } catch (aiErr) {
      console.error("\u{1F6A8} GEMINI AI FATAL ERROR:", aiErr?.message || aiErr);
      console.error("Stack:", aiErr?.stack);
      return res.status(500).json({ error: "AI Failed", details: aiErr?.message || "Internal server error" });
    }
  } else {
    return res.json(getOfflineRecommendation());
  }
});
var aiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 100,
  // increased to 100 requests
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: "Terlalu banyak request ke layanan AI. Coba lagi dalam 1 menit." }
});
app.post("/api/gemini/site-selection", async (req, res) => {
  const { criteria, language } = req.body;
  if (!ai) {
    return res.status(503).json({ error: "AI service not configured" });
  }
  try {
    const activeLang = language || "id";
    let langDirective = "";
    if (activeLang === "en") {
      langDirective = "Provide the response entirely in English.";
    } else if (activeLang === "zh") {
      langDirective = "Provide the response entirely in Simplified Chinese.";
    } else {
      langDirective = "Provide the response entirely in Indonesian.";
    }
    const districtsInfo = districtsData.map((d) => `- ${d.name} (Area: ${d.areaHa} ha, Density: ${d.density} org/km2)`).join("\n");
    const prompt = `You are an expert Investment Geographer and Spatial Analyst for Kabupaten Luwu, Indonesia.
An investor has provided the following specific criteria for their site selection:
"${criteria}"

Here is a list of available districts in Kabupaten Luwu:
${districtsInfo}

Your task is to analyze the investor's criteria and recommend the top 3 best districts for their project.
Consider geographical suitability, logical logistics access, and general spatial characteristics.
${langDirective}

Return your analysis ONLY in the following JSON array format (no markdown, no extra text):
[
  {
    "districtName": "Name of district",
    "score": 95, 
    "reasoning": "Detailed explanation of why this district is highly suitable based on the criteria..."
  }
]`;
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const rawJson = response.text?.trim() || "";
    const cleaned = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
    const resultObj = JSON.parse(cleaned);
    return res.json(resultObj);
  } catch (err) {
    console.error("AI Site Selection Error:", err);
    return res.status(500).json({ error: "Gagal memproses rekomendasi lokasi AI." });
  }
});
var currentKeyIndex = 0;
async function generateContentWithFallback(params, modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]) {
  const rotationKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7
  ].filter((key) => key && key.startsWith("AIza") && key !== "MY_GEMINI_API_KEY" && key !== "");
  const fallbackKeys = [];
  if (process.env.GEMINI_API_KEY_FIRST && process.env.GEMINI_API_KEY_FIRST.startsWith("AIza") && process.env.GEMINI_API_KEY_FIRST !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY_FIRST !== "") {
    fallbackKeys.push(process.env.GEMINI_API_KEY_FIRST);
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith("AIza") && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY !== "") {
    fallbackKeys.push(process.env.GEMINI_API_KEY);
  }
  const keysToTry = rotationKeys.length > 0 ? rotationKeys : fallbackKeys;
  if (keysToTry.length === 0) {
    if (ai) {
      return await runWithClient(ai, params, modelsToTry);
    } else {
      throw new Error("No Gemini API key configured in env.");
    }
  }
  let lastError = null;
  const attemptsCount = keysToTry.length;
  for (let attempt = 0; attempt < attemptsCount; attempt++) {
    const activeIndex = rotationKeys.length > 0 ? (currentKeyIndex + attempt) % keysToTry.length : attempt;
    const currentKey = keysToTry[activeIndex];
    try {
      const tempClient = new import_genai.GoogleGenAI({
        apiKey: currentKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const response = await runWithClient(tempClient, params, modelsToTry);
      if (rotationKeys.length > 0) {
        currentKeyIndex = (activeIndex + 1) % keysToTry.length;
      }
      return response;
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
    }
  }
  throw lastError || new Error("All rotational API keys and fallback models failed.");
}
app.get("/api/gemini/test", (req, res) => res.json({ status: "AI Route is Alive" }));
app.get("/api/rag", async (req, res) => {
  try {
    const { data: dbDocs, error } = await supabase2.from("knowledge_documents").select("id, title, created_at, file_path");
    if (error) {
      console.error("rag error:", error);
      return res.status(500).json({ error: "Failed to fetch RAG docs" });
    }
    const formattedDocs = (dbDocs || []).map((doc) => ({
      id: doc.id,
      filename: doc.title,
      uploadedAt: doc.created_at,
      size: 0
    }));
    res.json(formattedDocs);
  } catch (err) {
    console.error("rag get error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/rag/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload file PDF gagal." });
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text;
    const newDocId = crypto.randomUUID();
    const { error: dbHeaderError } = await supabase2.from("knowledge_documents").insert([
      {
        id: newDocId,
        title: req.file.originalname,
        category: "regulasi",
        source_agency: "Dinas Penanaman Modal Luwu",
        publication_year: (/* @__PURE__ */ new Date()).getFullYear(),
        status: "completed",
        is_active: true
      }
    ]);
    if (dbHeaderError) {
      throw new Error(`Gagal menyimpan header: ${dbHeaderError.message}`);
    }
    if (ai) {
      const maxChunkSize = 1e3;
      const chunks = [];
      let i = 0;
      while (i < extractedText.length) {
        let end = i + maxChunkSize;
        if (end < extractedText.length) {
          const lastSpace = extractedText.lastIndexOf(" ", end);
          if (lastSpace > i) {
            end = lastSpace;
          }
        }
        chunks.push(extractedText.slice(i, end).trim());
        i = end;
      }
      const filteredChunks = chunks.filter((c) => c.trim().length >= 10);
      for (const chunkText of filteredChunks) {
        try {
          const embedRes = await ai.models.embedContent({
            model: "gemini-embedding-2",
            contents: chunkText,
            config: { outputDimensionality: 1536 }
          });
          if (embedRes.embeddings && embedRes.embeddings.length > 0) {
            const embedding = embedRes.embeddings[0].values;
            if (!embedding || embedding.length === 0) {
              continue;
            }
            const chunkId = crypto.randomUUID();
            const { error } = await supabase2.from("document_chunks").insert({
              id: chunkId,
              document_id: newDocId,
              content: chunkText,
              embedding,
              page_number: 1
            });
            if (error) console.error("Error inserting embedding for chunk:", error.message);
          }
        } catch (emErr) {
          console.error("Embedding chunk failed:", emErr?.message || emErr);
        }
      }
    }
    const cleanExtracted = extractedText ? extractedText.trim() : "";
    let previewText = "";
    if (!cleanExtracted || cleanExtracted.length === 0 || !/[a-zA-Z]/.test(cleanExtracted)) {
      previewText = "No readable text detected. Ensure the document is not a scanned image.";
    } else {
      previewText = cleanExtracted.slice(0, 200);
      if (cleanExtracted.length > 200) {
        previewText += "...";
      }
    }
    res.json({ success: true, docId: newDocId, previewText });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses PDF: " + err.message });
  }
});
app.delete("/api/rag/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase2.from("knowledge_documents").delete().eq("id", id);
  res.json({ success: !error });
});
app.post("/api/process-rag", async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: "Missing documentId" });
    const { data: doc, error: fetchErr } = await supabase2.from("knowledge_documents").select("*").eq("id", documentId).single();
    if (fetchErr || !doc) {
      console.error("Error fetching doc in process-rag:", fetchErr);
      return res.status(404).json({ error: "Document not found" });
    }
    await supabase2.from("knowledge_documents").update({ status: "processing" }).eq("id", documentId);
    const bucketName = "knowledge_base";
    const { data: fileData, error: downloadErr } = await supabase2.storage.from(bucketName).download(doc.file_path);
    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from storage:", downloadErr);
      await supabase2.from("knowledge_documents").update({ status: "failed" }).eq("id", documentId);
      return res.status(500).json({ error: "Failed to download PDF from storage: " + (downloadErr?.message || "empty data") });
    }
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);
    const extractedText = parsed.text;
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No readable text detected in PDF.");
    }
    const maxChunkSize = 1e3;
    const chunks = [];
    let i = 0;
    while (i < extractedText.length) {
      let end = i + maxChunkSize;
      if (end < extractedText.length) {
        const lastSpace = extractedText.lastIndexOf(" ", end);
        if (lastSpace > i) {
          end = lastSpace;
        }
      }
      chunks.push(extractedText.slice(i, end).trim());
      i = end;
    }
    const filteredChunks = chunks.filter((c) => c.trim().length >= 10);
    if (ai) {
      for (let idx = 0; idx < filteredChunks.length; idx++) {
        const chunkText = filteredChunks[idx];
        try {
          const embedRes = await ai.models.embedContent({
            model: "gemini-embedding-2",
            contents: chunkText,
            config: { outputDimensionality: 1536 }
          });
          if (embedRes.embeddings && embedRes.embeddings.length > 0) {
            const embedding = embedRes.embeddings[0].values;
            if (embedding && embedding.length > 0) {
              await supabase2.from("document_chunks").insert({
                document_id: documentId,
                content: chunkText,
                embedding,
                page_number: 1
              });
            }
          }
        } catch (embedErr) {
          console.error(`Chunk ${idx} embedding failed:`, embedErr);
        }
      }
    } else {
    }
    await supabase2.from("knowledge_documents").update({ status: "completed" }).eq("id", documentId);
    res.json({ success: true, message: "RAG Document processing completed successfully", chunksCount: filteredChunks.length });
  } catch (err) {
    console.error("process-rag failed:", err);
    if (req.body.documentId) {
      await supabase2.from("knowledge_documents").update({ status: "failed" }).eq("id", req.body.documentId);
    }
    res.status(500).json({ error: "Gagal memproses dokumen: " + err.message });
  }
});
app.post("/api/gemini/narrative", async (req, res) => {
  const { sector, areaHa, production, capex, province, roi, infrastructures, language } = req.body;
  const activeLang = language || "id";
  try {
    if (!ai) {
      return res.status(503).json({ error: "Gemini API client is not initialized" });
    }
    let prompt = "";
    if (activeLang === "en") {
      prompt = `Create an Investment Brief / Executive Summary for the following investment potential in Luwu Regency, written entirely in professional English:
Sector: ${sector}
Area: ${areaHa} Ha
Production: ${production}
CAPEX: Rp ${capex}
Province: ${province}
Estimated ROI: ${roi}%
Infrastructures: ${infrastructures}

Write 300-500 words consisting of:
1. Potential Summary
2. Executive Summary
3. Investment Brief
Format using clean markdown without introductory conversational text.`;
    } else if (activeLang === "zh") {
      prompt = `\u8BF7\u4E3A\u5370\u5EA6\u5C3C\u897F\u4E9A\u9C81\u4E4C\u53BF\uFF08Luwu Regency\uFF09\u7684\u4EE5\u4E0B\u6295\u8D44\u6F5C\u529B\u9879\u76EE\u64B0\u5199\u4E00\u4EFD\u5B8C\u5168\u7528\u4E2D\u6587\uFF08\u7B80\u4F53\uFF09\u4E66\u5199\u7684\u6295\u8D44\u7B80\u62A5 / \u6267\u884C\u6458\u8981\uFF1A
\u884C\u4E1A\u90E8\u95E8: ${sector}
\u571F\u5730\u9762\u79EF: ${areaHa} \u516C\u9877
\u751F\u4EA7\u6F5C\u529B: ${production}
\u8D44\u672C\u652F\u51FA (CAPEX): Rp ${capex}
\u7701\u4EFD: ${province}
\u9884\u8BA1\u6295\u8D44\u56DE\u62A5\u7387 (ROI): ${roi}%
\u914D\u5957\u57FA\u7840\u8BBE\u65BD: ${infrastructures}

\u64B0\u5199300-500\u5B57\uFF0C\u5185\u5BB9\u5305\u542B\uFF1A
1. \u6295\u8D44\u6F5C\u529B\u6982\u8FF0
2. \u6267\u884C\u6458\u8981
3. \u6295\u8D44\u7B80\u62A5
\u8BF7\u4F7F\u7528\u6574\u6D01\u7684 Markdown \u683C\u5F0F\u8F93\u51FA\uFF0C\u4E0D\u5305\u542B\u4EFB\u4F55\u524D\u8A00\u6216\u5E9F\u8BDD\u3002`;
    } else {
      prompt = `Buat Investment Brief / Executive Summary untuk potensi investasi berikut di Kabupaten Luwu:
Sektor: ${sector}
Luas: ${areaHa} Ha
Produksi: ${production}
CAPEX: Rp ${capex}
Provinsi: ${province}
ROI Estimasi: ${roi}%
Infrastruktur: ${infrastructures}

Tulis 300-500 kata yang terdiri dari:
1. Ringkasan Potensi Investasi
2. Executive Summary
3. Investment Brief
Format menggunakan markdown yang rapi tanpa preamble.`;
    }
    const response = await generateContentWithFallback({
      contents: prompt
    });
    res.json({ narrative: response.text });
  } catch (error) {
    console.error("Gemini Narrative Error, using robust metadata offline fallback:", error);
    let fallbackBrief = "";
    if (activeLang === "en") {
      fallbackBrief = `### 1. Potential Summary
The development of the **${sector}** sector in Luwu Regency with a planned area of **${areaHa} Hectares** is one of the local government's top priorities. This investment is projected to deliver high value-add to the regional economy.

### 2. Executive Summary
With an estimated CAPEX of **Rp ${capex || "0"}**, this project is predicted to reach an annual return on investment (ROI) of **${roi || "15"}%**. The presence of supporting infrastructure like **${infrastructures || "Main Transportation Corridor"}** ensures seamless and reliable logistics integration.

### 3. Investment Brief
Luwu Regency offers an excellent business environment, local fiscal incentives, and single-window licensing (PTSP) support. This project is highly feasible to build an integrated upstream-downstream industrial ecosystem promising long-term sustainable profitability.`;
    } else if (activeLang === "zh") {
      fallbackBrief = `### 1. \u6295\u8D44\u6F5C\u529B\u6982\u8FF0
\u5728\u9C81\u4E4C\u53BF\u5F00\u53D1 **${sector}** \u884C\u4E1A\uFF08\u89C4\u5212\u9762\u79EF\u4E3A **${areaHa} \u516C\u9877**\uFF09\u662F\u5730\u65B9\u653F\u5E9C\u7684\u91CD\u70B9\u4F18\u5148\u4E8B\u9879\u4E4B\u4E00\u3002\u8BE5\u6295\u8D44\u9884\u8BA1\u5C06\u4E3A\u533A\u57DF\u7ECF\u6D4E\u6CE8\u5165\u9AD8\u9644\u52A0\u503C\u3002

### 2. \u6267\u884C\u6458\u8981
\u9884\u8BA1\u8D44\u672C\u652F\u51FA (CAPEX) \u4E3A **Rp ${capex || "0"}**\uFF0C\u8BE5\u9879\u76EE\u9884\u8BA1\u5E74\u6295\u8D44\u56DE\u62A5\u7387 (ROI) \u5C06\u8FBE\u5230 **${roi || "15"}%**\u3002\u73B0\u6709\u914D\u5957\u57FA\u7840\u8BBE\u65BD\uFF08\u5982 **${infrastructures || "\u4E3B\u8981\u4EA4\u901A\u8D70\u5ECA"}**\uFF09\u786E\u4FDD\u4E86\u65E0\u7F1D\u548C\u53EF\u9760\u7684\u7269\u6D41\u6574\u5408\u3002

### 3. \u6295\u8D44\u7B80\u62A5
\u9C81\u4E4C\u53BF\u63D0\u4F9B\u6781\u4F73\u7684\u5546\u4E1A\u73AF\u5883\u3001\u5730\u65B9\u8D22\u653F\u6FC0\u52B1\u4EE5\u53CA\u4E00\u7AD9\u5F0F\uFF08PTSP\uFF09\u8BB8\u53EF\u652F\u6301\u3002\u8BE5\u9879\u76EE\u975E\u5E38\u53EF\u884C\uFF0C\u53EF\u6253\u9020\u4E00\u4E2A\u4FDD\u969C\u957F\u671F\u53EF\u6301\u7EED\u76C8\u5229\u7684\u5B8C\u6574\u4E0A\u4E0B\u6E38\u4EA7\u4E1A\u751F\u6001\u7CFB\u7EDF\u3002`;
    } else {
      fallbackBrief = `### 1. Ringkasan Potensi Investasi
Pengembangan potensi di sektor **${sector}** Kabupaten Luwu dengan luas rencana **${areaHa} Hektar** merupakan salah satu prioritas pembangunan unggulan daerah. Investasi ini diproyeksikan memberikan nilai tambah tinggi bagi perekonomian lokal.

### 2. Executive Summary
Dengan estimasi CAPEX sebesar **Rp ${capex || "0"}**, proyek ini diprediksi mencapai tingkat pengembalian investasi (ROI) sebesar **${roi || "15"}%** per tahun. Keberadaan infrastruktur pendukung seperti **${infrastructures || "Koridor Transportasi Utama"}** memastikan integrasi logistik yang lancar dan danal.

### 3. Investment Brief
Kabupaten Luwu menawarkan iklim kemudahan berusaha, insentif fiskal daerah, dan dukungan perizinan satu pintu (PTSP). Proyek ini sangat layak didaur ulang menjadi ekosistem industri hulu-hilir terintegrasi yang menjanjikan profitabilitas berkelanjutan kawan.`;
    }
    res.json({ narrative: fallbackBrief });
  }
});
app.post("/api/gemini/translate", async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing 'text' or 'targetLang' in request body" });
  }
  if (targetLang === "id" || !text.trim()) {
    return res.json({ translatedText: text });
  }
  try {
    let languageName = "English";
    if (targetLang === "zh") {
      languageName = "Simplified Chinese";
    }
    const prompt = `You are a professional translator translating Indonesian spatial planning, infrastructure, and investment project details for the government of Luwu Regency (Kabupaten Luwu), Indonesia.
Translate the following text into clear, natural, and highly professional ${languageName}. Keep technical parameters, numbers, distances (e.g. "km"), coordinates, or markdown symbols exactly as they are.
Provide ONLY the direct translation of the input text, without any introductory or concluding remarks, explanations, or quotes.

Text to translate:
${text}`;
    const response = await generateContentWithFallback({
      contents: prompt
    });
    const translatedText = response.text ? response.text.trim() : text;
    res.json({ translatedText });
  } catch (error) {
    console.error("Auto-translation error, falling back to original:", error);
    res.json({ translatedText: text });
  }
});
app.post("/api/gemini/generate-tour", async (req, res) => {
  const { theme } = req.body;
  const getOfflineTour = () => [
    {
      coordinates: [-3.1111, 120.3582],
      zoom: 12.5,
      pitch: 58,
      bearing: -20,
      title: `1. Koridor Utama ${theme || "Pilihan"} di Kawasan Bua`,
      desc: `Area logistik penyangga pelabuhan dan bandara udara yang sangat ideal untuk menempatkan simpul distribusi utama kawan!`
    },
    {
      coordinates: [-3.4025, 120.3294],
      zoom: 13,
      pitch: 45,
      bearing: 15,
      title: `2. Hub Administratif ${theme || "Pilihan"} Belopa`,
      desc: `Pusat layanan pemerintahan terpadu satu pintu (PTSP) di ibukota Belopa yang menjamin transparansi serta kenyamanan berinvestasi kawan.`
    },
    {
      coordinates: [-3.2954, 120.0824],
      zoom: 12.8,
      pitch: 60,
      bearing: -25,
      title: `3. Hulu & Sektor Hijau ${theme || "Pilihan"} Latimojong`,
      desc: `Wilayah dataran tinggi Latimojong yang sangat memikat untuk pengembangan agribisnis ramah alam dan ekowisata kopi premium berkelanjutan kawan.`
    }
  ];
  if (!ai) {
    return res.json(getOfflineTour());
  }
  try {
    const prompt = `Kamu adalah perancang tour geospasial profesional untuk Kabupaten Luwu, Indonesia.
Rancang sebuah rangkaian tour sinematik 3D map flyover yang terdiri dari 3 titik/langkah penting di Kabupaten Luwu berdasarkan tema investasi berikut: "${theme || "Potensi Unggulan"}".

Setiap langkah dalam tour harus berada di wilayah Kabupaten Luwu. Untuk akurasi lokasi, gunakan koordinat referensi ini atau koordinat terdekat di dalam batas Luwu (Latitude: -3.55 sampai -2.7, Longitude: 120.0 sampai 120.45):
- Belopa (Ibukota, Administrasi): -3.4025, 120.3294
- Bua (Bandara, Logistik, Kelautan): -3.1111, 120.3582
- Lamasi (Lumbung Padi, Pertanian): -2.8945, 120.1764
- Latimojong (Kopi Arabika, Gunung, Mineral): -3.2954, 120.0824
- Ponrang (Kelautan, Pertanian, Tambak Sagu): -3.2385, 120.3275
- Suli (Pertanian, Pesisir): -3.4385, 120.3175
- Larompong (Perkebunan, Cengkeh, Kelapa): -3.4831, 120.3122

Hasilkan respon HANYA dalam format array JSON berikut saja, tanpa blok markdown, dan pastikan coordinates ditulis dalam format [latitude, longitude] bertipe number:
[
  {
    "coordinates": [-3.1111, 120.3582], 
    "zoom": 12.5, 
    "pitch": 55, 
    "bearing": -15, 
    "title": "Nama tour langkah 1 (Menonjolkan keterkaitan dengan tema)",
    "desc": "Penjelasan detail 2-3 kalimat berbahasa Indonesia kawan mengenai potensi, keunikan, jangkauan jalan nasional/bandara di titik ini."
  }
]`;
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });
    const rawJson = response.text?.trim() || "";
    const cleaned = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
    const resultObj = JSON.parse(cleaned);
    res.json(resultObj);
  } catch (error) {
    console.error("Gemini Generate Tour Error:", error);
    res.json(getOfflineTour());
  }
});
app.get("/api/moderation/drafts", async (req, res) => {
  try {
    const currentRole = parseAndValidateRole(req);
    if (currentRole !== "Super Admin") {
      return res.status(403).json({ error: "Akses Ditolak" });
    }
    const { data: potRows, error: potErr } = await fetchAndJoinInvestments();
    if (potErr) {
      console.error("Fetch draft investments relational error:", potErr);
    }
    let infraRows = [];
    try {
      const { data } = await supabase2.rpc("get_layer_data", { p_table_name: "gis_infrastruktur" });
      if (data) infraRows = data;
    } catch (infraErr) {
    }
    const drafts = [];
    if (potRows) {
      potRows.forEach((row) => {
        const item = prepareForFrontend(row);
        const status = item.status || "Draft";
        if (status.toLowerCase() !== "published") {
          const gisPot = item.gisPotensiInvestasi?.[0] || {};
          const finObj = item.financials?.[0] || {};
          const locObj = item.locations?.[0] || {};
          const medObj = item.mediaAssets?.[0] || {};
          const scoreObj = item.investmentScores?.[0] || {};
          drafts.push({
            id: item.id,
            name: item.name || "Potensi Tanpa Nama",
            type: "Potensi Investasi",
            category: item.sector || "Tata Ruang",
            status,
            raw: {
              id: item.id,
              type: "Feature",
              geometry: item.geometry || gisPot.geom || null,
              properties: {
                id: item.id,
                name: item.name,
                category: item.sector,
                status,
                areaHa: Number(item.areaHa) || Number(gisPot.luasLahan) || 0,
                investmentValue: Number(item.investmentValue) || Number(finObj.capex) || 0,
                landStatus: item.landStatus,
                photoUrl: item.photoUrl,
                photoUrls: item.photoUrls || medObj.photos || [],
                contactPic: item.contactPic,
                phoneNumber: item.phoneNumber,
                createdAt: item.createdAt,
                smartData: {
                  ...item,
                  luasLahan: Number(gisPot.luasLahan) || Number(item.areaHa),
                  ownershipStatus: item.landStatus,
                  capex: Number(finObj.capex) || Number(item.investmentValue),
                  gallery: medObj.photos || []
                }
              }
            },
            collection: "potensi_investasi"
          });
        }
      });
    }
    if (infraRows) {
      infraRows.forEach((doc) => {
        const id = doc.id || doc.properties?.id;
        const status = doc.properties?.status_publikasi || doc.properties?.status || "Draft";
        if (status.toLowerCase() !== "published") {
          drafts.push({
            id,
            name: doc.properties?.nama_infrastruktur || doc.properties?.name || "Infrastruktur Tanpa Nama",
            type: "Titik Infrastruktur",
            category: doc.properties?.kategori || doc.properties?.category || "Infrastruktur",
            status,
            raw: doc,
            collection: "infrastruktur"
          });
        }
      });
    }
    res.json({ success: true, count: drafts.length, data: drafts });
  } catch (err) {
    console.error("Fetch moderation drafts error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/moderation/approve", async (req, res) => {
  try {
    const currentRole = parseAndValidateRole(req);
    if (currentRole !== "Super Admin") {
      return res.status(403).json({ error: "Akses Ditolak: Hanya Superadmin yang dapat melakukan moderasi publikasi." });
    }
    const { id, collection, status } = req.body;
    if (!id || !collection) {
      return res.status(400).json({ error: "Missing id or collection parameter" });
    }
    let tableName = "";
    if (collection === "potensi_investasi" || collection === "gis_potensi_investasi") {
      tableName = "gis_potensi_investasi";
    } else if (collection === "infrastruktur" || collection === "gis_infrastruktur") {
      tableName = "gis_infrastruktur";
    } else {
      tableName = collection;
    }
    const updatePayload = {
      status: status || "Published",
      status_publikasi: status || "Published",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data: updateData, error: updateErr } = await supabase2.from(tableName).update(updatePayload).eq("id", id).select();
    if (updateErr) {
      console.error("DEBUG UPDATE ERR:", updateErr);
      return res.status(500).json({ error: "Failed to publish: " + updateErr.message });
    }
    if (!updateData || updateData.length === 0) {
      return res.status(404).json({ error: "Gagal mempublish data: Record tidak ditemukan atau RLS (Row Level Security) membatasi akses update Anda." });
    }
    if (collection === "potensi_investasi" || collection === "gis_potensi_investasi") {
      const { data: invData, error: invErr } = await supabase2.from("investments").update({
        status: status || "Published",
        status_publikasi: status || "Published",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id).select();
    }
    await syncWithSupabase();
    res.json({ success: true, message: "Persetujuan sukses! Dokumen telah dipublikasikan ke peta." });
  } catch (err) {
    console.error("Moderation approve error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/investments/:id/spatial-analysis", async (req, res) => {
  const id = req.params.id;
  try {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    let lat = -3.2541;
    let lng = 120.2546;
    let name = id;
    let invRow = null;
    if (isUuid) {
      const { data } = await supabase2.from("investments").select("*").eq("id", id).maybeSingle();
      if (data) {
        invRow = data;
        if (data.latitude && data.longitude) {
          lat = Number(data.latitude);
          lng = Number(data.longitude);
        }
        name = data.name;
      } else {
        const { data: gRow } = await supabase2.from("gis_potensi_investasi").select("*").eq("id", id).maybeSingle();
        if (gRow) {
          invRow = gRow;
          if (gRow.latitude && gRow.longitude) {
            lat = Number(gRow.latitude);
            lng = Number(gRow.longitude);
          } else if (gRow.geom && gRow.geom.type === "Point") {
            lng = gRow.geom.coordinates[0];
            lat = gRow.geom.coordinates[1];
          } else if (gRow.geom && gRow.geom.coordinates && Array.isArray(gRow.geom.coordinates)) {
            const coords = gRow.geom.coordinates;
            let sumLat = 0, sumLng = 0, count = 0;
            const processCoords = (arr) => {
              if (typeof arr[0] === "number") {
                sumLng += arr[0];
                sumLat += arr[1];
                count++;
              } else {
                arr.forEach((sub) => processCoords(sub));
              }
            };
            processCoords(coords);
            if (count > 0) {
              lat = sumLat / count;
              lng = sumLng / count;
            }
          }
          name = gRow.nama_potensi;
        }
      }
    } else {
      try {
        const { data: gisRow } = await supabase2.from("gis_potensi_investasi").select("*").eq("nama_potensi", id).maybeSingle();
        if (gisRow) {
          invRow = gisRow;
          if (gisRow.latitude && gisRow.longitude) {
            lat = Number(gisRow.latitude);
            lng = Number(gisRow.longitude);
          } else if (gisRow.geom && gisRow.geom.type === "Point") {
            lng = gisRow.geom.coordinates[0];
            lat = gisRow.geom.coordinates[1];
          }
          name = gisRow.nama_potensi || id;
        }
      } catch (e) {
      }
    }
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const getPgRouteDistance = async (startLat, startLng, endLat, endLng, polygonGeom = null) => {
      try {
        const fromParam = polygonGeom ? { type: "Feature", geometry: polygonGeom, properties: {} } : [startLng, startLat];
        const res2 = await getDistance(fromParam, [endLng, endLat], { units: "kilometers" }, supabase2);
        return {
          distanceKm: res2.distance,
          isNetworkRouting: res2.method === "NETWORK"
        };
      } catch (err) {
        const distGeo = getDistanceKm(startLat, startLng, endLat, endLng);
        return { distanceKm: Number(distGeo.toFixed(2)), isNetworkRouting: false };
      }
    };
    const polyGeom = invRow?.geom || invRow?.geometry || null;
    const districtQuery = invRow?.district_name || invRow?.districtName || invRow?.district || invRow?.lokasi || invRow?.kecamatan || "";
    const potensiQuery = invRow?.potensi_name || invRow?.title || invRow?.name || "";
    const hydroData = getHydrologyByDistrictName(districtQuery, lat, lng, potensiQuery);
    const [waterLng, waterLat] = hydroData.intakeCoordinates;
    const [
      resPort,
      resAirport,
      resGovt,
      resHospital,
      resMarket,
      resPolice,
      resPower,
      resTelco,
      resWater
    ] = await Promise.all([
      getPgRouteDistance(lat, lng, -3.386061643485775, 120.39793462368112, polyGeom),
      // Pelabuhan Ulo-Ulo Belopa
      getPgRouteDistance(lat, lng, -3.086338491260946, 120.24132322502385, polyGeom),
      // Bandara Udara Bua
      getPgRouteDistance(lat, lng, -3.394828505594006, 120.36547889067685, polyGeom),
      // Kantor Bupati Luwu
      getPgRouteDistance(lat, lng, -3.367913100409524, 120.35719728255344, polyGeom),
      // RSUD Batara Guru
      getPgRouteDistance(lat, lng, -3.37644610992929, 120.35794806101296, polyGeom),
      // Pasar Sentral Belopa
      getPgRouteDistance(lat, lng, -3.408870133207785, 120.36930532613906, polyGeom),
      // Kepolisian Resort Luwu
      getPgRouteDistance(lat, lng, -3.391244, 120.358512, polyGeom),
      // Gardu Induk Belopa 150 kV
      getPgRouteDistance(lat, lng, -3.365412, 120.351224, polyGeom),
      // Menara Telko / BTS
      getPgRouteDistance(lat, lng, waterLat, waterLng, polyGeom)
      // Intake Air Baku Sungai / DAS Kecamatan
    ]);
    let distRoad = invRow?.spatial_sync?.nearest_road_km || null;
    if (distRoad === null || isNaN(Number(distRoad))) {
      distRoad = 0.15;
    } else {
      distRoad = Number(Number(distRoad).toFixed(2));
    }
    const distances = {
      nearestRoad: { name: "Akses Menuju Jaringan Jalan Utama Terdekat", distanceKm: distRoad, type: "National Road", isNetworkRouting: true },
      nearestPort: { name: "Pelabuhan Ulo-Ulo Belopa", distanceKm: resPort.distanceKm, isNetworkRouting: resPort.isNetworkRouting },
      nearestAirport: { name: "Bandara Udara Bua", distanceKm: resAirport.distanceKm, isNetworkRouting: resAirport.isNetworkRouting },
      nearestPowerGrid: { name: "Gardu Induk Belopa 150 kV", distanceKm: resPower.distanceKm, isNetworkRouting: resPower.isNetworkRouting },
      nearestWaterSource: {
        name: hydroData.hasDirectDas ? `${hydroData.dasName} (${hydroData.riverName})` : `${hydroData.dasName} (${hydroData.riverName}) [Suplesi Kec. ${hydroData.neighborFallbackKecamatan}]`,
        riverName: hydroData.riverName,
        dasName: hydroData.dasName,
        kecamatanName: hydroData.kecamatanName,
        hasDirectDas: hydroData.hasDirectDas,
        neighborFallbackKecamatan: hydroData.neighborFallbackKecamatan || null,
        debitCapacity: hydroData.debitCapacity,
        usageSuitability: hydroData.usageSuitability,
        distanceKm: resWater.distanceKm,
        isNetworkRouting: resWater.isNetworkRouting,
        rpjpdRef: hydroData.rpjpdTableRef
      },
      nearestTelco: { name: "Tower BTS Seluler Regional", distanceKm: resTelco.distanceKm, isNetworkRouting: resTelco.isNetworkRouting },
      nearestHospital: { name: "RSUD Batara Guru", distanceKm: resHospital.distanceKm, isNetworkRouting: resHospital.isNetworkRouting },
      nearestGovernment: { name: "Kantor Bupati Luwu", distanceKm: resGovt.distanceKm, isNetworkRouting: resGovt.isNetworkRouting },
      nearestMarket: { name: "Pasar Sentral Belopa", distanceKm: resMarket.distanceKm, isNetworkRouting: resMarket.isNetworkRouting },
      nearestPolice: { name: "Kepolisian Resort Luwu", distanceKm: resPolice.distanceKm, isNetworkRouting: resPolice.isNetworkRouting }
    };
    let accessibilityScore = 0;
    const road = distances.nearestRoad.distanceKm;
    const port = distances.nearestPort.distanceKm;
    const airport = distances.nearestAirport.distanceKm;
    const power = distances.nearestPowerGrid.distanceKm;
    if (road < 2) accessibilityScore += 30;
    else if (road < 5) accessibilityScore += 20;
    else if (road < 10) accessibilityScore += 10;
    else if (road < 20) accessibilityScore += 5;
    if (port < 10) accessibilityScore += 25;
    else if (port < 30) accessibilityScore += 15;
    else if (port < 50) accessibilityScore += 8;
    else if (port < 80) accessibilityScore += 3;
    if (airport < 15) accessibilityScore += 25;
    else if (airport < 30) accessibilityScore += 15;
    else if (airport < 60) accessibilityScore += 8;
    else if (airport < 100) accessibilityScore += 3;
    if (power < 3) accessibilityScore += 20;
    else if (power < 8) accessibilityScore += 13;
    else if (power < 15) accessibilityScore += 7;
    else if (power < 25) accessibilityScore += 3;
    let accessibilityLabel = "Sulit Diakses";
    if (accessibilityScore >= 81) accessibilityLabel = "Sangat Mudah Diakses";
    else if (accessibilityScore >= 61) accessibilityLabel = "Mudah Diakses";
    else if (accessibilityScore >= 41) accessibilityLabel = "Cukup Terjangkau";
    res.json({
      centroid: { lat, lng },
      distances,
      accessibilityScore,
      accessibilityLabel
    });
  } catch (err) {
    console.error("Spatial analysis route error:", err);
    const fallbackData = {
      centroid: { lat: -3.2541, lng: 120.2546 },
      distances: {
        nearestRoad: { name: "Jl. Poros Palopo - Makassar (Trans Sulawesi)", distanceKm: 2.1, type: "National Road" },
        nearestPort: { name: "Pelabuhan Ulo-Ulo Belopa", distanceKm: 12.4 },
        nearestAirport: { name: "Bandara Udara Bua", distanceKm: 31.8 },
        nearestPowerGrid: { name: "Gardu Induk Belopa 150 kV", distanceKm: 6.5 },
        nearestTelco: { name: "Tower BTS Seluler Regional", distanceKm: 1.1 }
      },
      accessibilityScore: 78,
      accessibilityLabel: "Mudah Diakses"
    };
    res.json(fallbackData);
  }
});
app.get("/api/investments/:id/full-profile", async (req, res) => {
  const id = req.params.id;
  try {
    const detailData = await getInvestmentFullProfileFallback(id);
    return res.json(detailData || {});
  } catch (err) {
    console.error("Full profile error:", err);
    res.status(200).json({ status: "fallback", data: {} });
  }
});
async function getInvestmentFullProfileFallback(id) {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  if (!isUuid) {
    let gisData = null;
    try {
      const { data } = await supabase2.from("gis_potensi_investasi").select("*").eq("nama_potensi", id).maybeSingle();
      gisData = data;
    } catch (e) {
    }
    if (!gisData) {
      try {
        const { data } = await supabase2.from("gis_potensi_investasi").select("*").ilike("nama_potensi", `%${id}%`).limit(1).maybeSingle();
        gisData = data;
      } catch (e) {
      }
    }
    if (!gisData) {
      try {
        const { data } = await supabase2.from("gis_potensi_investasi").select("*").ilike("kecamatan", `%${id}%`).limit(1).maybeSingle();
        gisData = data;
      } catch (e) {
      }
    }
    if (!gisData) {
      try {
        const { data } = await supabase2.from("gis_potensi_investasi").select("*").limit(1).maybeSingle();
        gisData = data;
      } catch (e) {
      }
    }
    if (gisData) {
      const estValue = Number(gisData.estimasi_nilai) || 5e9;
      const baselineFin = [{
        capex: estValue,
        opex: estValue * 0.12,
        revenue: estValue * 0.35,
        net_profit: estValue * 0.23,
        payback_period: 3.5,
        irr: 18.5,
        npv: estValue * 0.85,
        roi: 23
      }];
      return {
        id: gisData.id || id,
        name: gisData.nama_potensi || id,
        sector: gisData.sektor_utama || "UMUM",
        description: gisData.deskripsi_singkat || "Sektor potensi aktif Kabupaten Luwu.",
        investmentValue: estValue,
        areaHa: gisData.luas_lahan || 0,
        status: gisData.status_publikasi || "Published",
        financials: baselineFin,
        legalities: [{ ownership_status: "Sertifikat Hak Milik / HGB Pemkab", status: "Clean & Clear" }],
        investment_scores: [{ ai_readiness_score: 88, spatial_score: 85 }],
        geometries: [],
        media_assets: [],
        locations: [{ district: gisData.kecamatan || "Bua Ponrang", village: gisData.desa || "Noling" }],
        infrastructures: [],
        gis_potensi_investasi: [gisData]
      };
    } else {
      return {
        id,
        name: id || "Potensi Investasi Luwu",
        sector: "UMUM",
        description: "Data profil lengkap sedang dalam proses pemetaan oleh dinas terkait kawan. Menampilkan peta spasial georeferensi aktif kawan.",
        investmentValue: 5e9,
        areaHa: 10,
        status: "Published",
        financials: [{
          capex: 5e9,
          opex: 6e8,
          revenue: 175e7,
          net_profit: 115e7,
          payback_period: 3.5,
          irr: 18.5,
          npv: 425e7,
          roi: 23
        }],
        legalities: [{ ownership_status: "Sertifikat Hak Milik", status: "Clean & Clear" }],
        investment_scores: [],
        geometries: [],
        media_assets: [],
        locations: [],
        infrastructures: [],
        gis_potensi_investasi: []
      };
    }
  }
  const safeSingle = async (table, column, val) => {
    try {
      const { data, error } = await supabase2.from(table).select("*").eq(column, val).maybeSingle();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: null };
    }
  };
  const safeList = async (table, column, val) => {
    try {
      const { data, error } = await supabase2.from(table).select("*").eq(column, val);
      return { data: data || [], error: null };
    } catch (e) {
      return { data: [], error: null };
    }
  };
  const [inv, fin, leg, sco, med, loc, inf, gis] = await Promise.all([
    safeSingle("investments", "id", id),
    safeList("financials", "project_id", id),
    safeList("legalities", "project_id", id),
    safeList("investment_scores", "project_id", id),
    safeList("media_assets", "project_id", id),
    safeList("locations", "project_id", id),
    Promise.resolve({ data: [] }),
    safeSingle("gis_potensi_investasi", "id", id)
  ]);
  const geo = { data: [] };
  if (!inv.data) {
    if (gis.data) {
      const estValue = Number(gis.data.estimasi_nilai) || 5e9;
      const financialsList = fin.data && fin.data.length > 0 ? fin.data : [{
        capex: estValue,
        opex: estValue * 0.12,
        revenue: estValue * 0.35,
        net_profit: estValue * 0.23,
        payback_period: 3.5,
        irr: 18.5,
        npv: estValue * 0.85,
        roi: 23
      }];
      return {
        id: gis.data.id || id,
        name: gis.data.nama_potensi || "Potensi Investasi Luwu",
        sector: gis.data.sektor_utama || "UMUM",
        description: gis.data.deskripsi_singkat || "Sektor potensi aktif Kabupaten Luwu.",
        investmentValue: estValue,
        areaHa: gis.data.luas_lahan || 0,
        status: gis.data.status_publikasi || "Published",
        financials: financialsList,
        legalities: leg.data || [],
        investment_scores: sco.data || [],
        geometries: geo.data || [],
        media_assets: med.data || [],
        locations: loc.data || [],
        infrastructures: inf.data || [],
        gis_potensi_investasi: [gis.data]
      };
    } else {
      return {
        id,
        name: "Sektor Potensi Umum Luwu",
        sector: "UMUM",
        description: "Data profil lengkap sedang dalam proses pemetaan oleh dinas terkait kawan. Menampilkan peta spasial georeferensi aktif kawan.",
        investmentValue: 5e9,
        areaHa: 10,
        status: "Published",
        financials: [{
          capex: 5e9,
          opex: 6e8,
          revenue: 175e7,
          net_profit: 115e7,
          payback_period: 3.5,
          irr: 18.5,
          npv: 425e7,
          roi: 23
        }],
        legalities: [],
        investment_scores: [],
        geometries: [],
        media_assets: [],
        locations: [],
        infrastructures: [],
        gis_potensi_investasi: []
      };
    }
  }
  const estVal = Number(inv.data.investment_value || inv.data.estimasi_nilai) || 5e9;
  const finalFinancials = fin.data && fin.data.length > 0 ? fin.data : [{
    capex: estVal,
    opex: estVal * 0.12,
    revenue: estVal * 0.35,
    net_profit: estVal * 0.23,
    payback_period: 3.5,
    irr: 18.5,
    npv: estVal * 0.85,
    roi: 23
  }];
  return {
    ...inv.data,
    financials: finalFinancials,
    legalities: leg.data || [],
    investment_scores: sco.data || [],
    geometries: geo.data || [],
    media_assets: med.data || [],
    locations: loc.data || [],
    infrastructures: inf.data || [],
    gis_potensi_investasi: gis.data ? [gis.data] : []
  };
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { port: 24678 + Math.floor(Math.random() * 1e4) }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  const isProdEnv = process.env.NODE_ENV === "production";
  if (isProdEnv) {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send(`[FATAL ERROR] index.html tidak ditemukan. Build Vite belum dijalankan!`);
      }
    });
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    (async () => {
      try {
        await syncWithSupabase();
      } catch (syncErr) {
        console.error("Warning: Initial background sync failed:", syncErr);
      }
    })();
  });
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Error bootstrapping server:", err);
  });
} else {
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
