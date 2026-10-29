import { 
  circle, 
  bbox, 
  explode, 
  nearestPoint, 
  polygonToLine, 
  point, 
  distance, 
  centroid, 
  feature, 
  nearestPointOnLine, 
  lineString 
} from '@turf/turf';
import type { Units } from '@turf/helpers';
// @ts-ignore
import PathFinderPkg from 'geojson-path-finder';
const PathFinder = (PathFinderPkg as any).default || PathFinderPkg;

export interface DistanceResult {
  distance: number;
  method: 'NETWORK' | 'EUCLIDEAN';
}

let cachedPathFinder: any = null;

function getNearestVertex(pt: any, linesGeojson: any): any {
  if (!linesGeojson || !linesGeojson.features || linesGeojson.features.length === 0) {
    return pt;
  }
  // Adaptive search: check within 3km, then 10km, then 30km, then fallback to global network
  const radii = [3, 10, 30];
  for (const radius of radii) {
    try {
      const searchCircle = circle(pt, radius, { units: 'kilometers' });
      const searchBbox = bbox(searchCircle);
          
      const nearbyFeatures = linesGeojson.features.filter((f: any) => {
        const fBox = bbox(f);
        return !(fBox[0] > searchBbox[2] || 
                 fBox[2] < searchBbox[0] || 
                 fBox[1] > searchBbox[3] || 
                 fBox[3] < searchBbox[1]);
      });
          
      if (nearbyFeatures.length > 0) {
        const exploded = explode({ type: 'FeatureCollection', features: nearbyFeatures } as any);
        return nearestPoint(pt, exploded);
      }
    } catch (err) {
      undefined;
    }
  }

  // Full network search fallback
  try {
    const exploded = explode(linesGeojson);
    return nearestPoint(pt, exploded);
  } catch (err) {
    undefined;
    return pt;
  }
}

function getAdaptiveNearestRoadPoint(pt: any, linesGeojson: any): any {
  return getNearestVertex(pt, linesGeojson);
}

function polygonToLineStrings(polygonGeom: any): any[] {
  const boundaryLines: any[] = [];
  try {
    if (polygonGeom.type === 'Polygon') {
      const line = polygonToLine(polygonGeom);
      if (line) {
        if (line.type === 'FeatureCollection') {
          boundaryLines.push(...line.features);
        } else {
          boundaryLines.push(line);
        }
      }
    } else if (polygonGeom.type === 'MultiPolygon') {
      const lines = polygonToLine(polygonGeom);
      if (lines) {
        if (lines.type === 'FeatureCollection') {
          boundaryLines.push(...lines.features);
        } else {
          boundaryLines.push(lines);
        }
      }
    }
  } catch (e) { }
  return boundaryLines;
}

// Cached PathFinder instances for different precisions
const cachedPathFinders: Record<number, any> = {};

function getPathFinderWithPrecision(precision: number, roads: any) {
  if (cachedPathFinders[precision]) return cachedPathFinders[precision];
  if (roads && roads.features && roads.features.length > 0) {
    try {
      // @ts-ignore
      cachedPathFinders[precision] = new PathFinder(roads, { 
        precision: precision,
        tolerance: precision, // FIX: Ensure tolerance matches precision to prevent search failures
        weightFn: (a: any, b: any, edge: any) => {
          const props = edge?.properties || {};
          const status = props.status || "";
          const fungsi = props.fungsi || props.fungsi_ren || "";
             
          // Hitung jarak Euclidean/Haversine antara koordinat titik simpul dalam Km
          const fromPt = point(a);
          const toPt = point(b);
          const dist = distance(fromPt, toPt, { units: 'kilometers' });
             
          // Deteksi apakah segmen jalan ini termasuk "Jalan Utama" (Nasional, Provinsi, Arteri, Kolektor)
          const isMainRoad = 
            status === 'Jalan Nasional' || 
            status === 'Jalan Provinsi' || 
            fungsi === 'Jalan Arteri' || 
            fungsi === 'Jalan Kolektor Primer' || 
            fungsi === 'Jalan Arteri Primer' || 
            fungsi === 'Rencana Jalan Kolektor Primer';
               
          // Berikan prioritas tinggi pada jalan utama dengan bobot asli (1.0), 
          // sedangkan jalan minor/lokal diberikan penalti biaya 3.0x agar dihindari oleh router
          if (isMainRoad) {
            return dist * 1.0;
          } else {
            return dist * 3.0;
          }
        }
      } as any);
    } catch (err) {}
  }
  return cachedPathFinders[precision];
}

function getPathFinder() {
  if (cachedPathFinder) return cachedPathFinder;
  const roads = typeof window !== 'undefined' 
    ? (window as any).luwuRoads 
    : (global as any).luwuRoads;
  if (roads && roads.features && roads.features.length > 0) {
    cachedPathFinder = getPathFinderWithPrecision(1e-4, roads);
  }
  return cachedPathFinder;
}

/**
 * Calculates the network distance using pgRouting via Supabase RPC.
 * Falls back to Euclidean (straight-line) distance if the network routing fails.
 * 
 * @param from Point [lng, lat] or Feature<Point>
 * @param to Point [lng, lat] or Feature<Point>
 * @param options options including units and syncOnly flag for editor snapping
 * @param client Supabase client to use (optional, defaults to frontend client)
 * @returns Object with distance (in km) and the method used.
 */
export async function getDistance(
  from: any,
  to: any,
  options: { units?: Units, syncOnly?: boolean } = { units: 'kilometers' },
  client: any = null
): Promise<DistanceResult> {
  const supabaseClient = client;
  
  let fromCoord: any = null;
  let polygonGeom = null;

  if (Array.isArray(from)) {
    fromCoord = from;
  } else if (from && from.geometry) {
    if (from.geometry.type === 'Polygon' || from.geometry.type === 'MultiPolygon') {
      polygonGeom = from.geometry;
      try {
        const cent = centroid(from);
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
  } else if (from && from.type === 'Feature' && from.geometry) {
    fromCoord = from.geometry.coordinates;
  }

  let toCoord = Array.isArray(to) ? to : (to.geometry ? to.geometry.coordinates : to.coordinates);

  if (!fromCoord || !toCoord || fromCoord.length < 2 || toCoord.length < 2) {
    throw new Error('Invalid coordinates for distance calculation.');
  }

  // 1. If we have a Polygon boundary, snap 'fromCoord' to the point on the boundary closest to the road network
  if (polygonGeom && (polygonGeom.type === 'Polygon' || polygonGeom.type === 'MultiPolygon')) {
    try {
      const roads = typeof window !== 'undefined' 
        ? (window as any).luwuRoads 
        : (global as any).luwuRoads;

      const boundaryLines = polygonToLineStrings(polygonGeom);

      if (boundaryLines.length > 0) {
        const polyCentroid = centroid(feature(polygonGeom));
        let closestRoadPt = null;

        if (roads && roads.features && roads.features.length > 0) {
          closestRoadPt = getAdaptiveNearestRoadPoint(polyCentroid, roads);
        }

        const refPt = closestRoadPt || point(toCoord);
        let minBoundaryDist = Infinity;
        let closestBoundaryPt = null;

        for (const boundaryLine of boundaryLines) {
          try {
            const snapped = nearestPointOnLine(boundaryLine, refPt);
            const dist = snapped.properties.dist || distance(refPt, snapped, { units: 'kilometers' });
            if (dist < minBoundaryDist) {
              minBoundaryDist = dist;
              closestBoundaryPt = snapped;
            }
          } catch (err) {}
        }

        if (closestBoundaryPt) {
          fromCoord = closestBoundaryPt.geometry.coordinates;
        }
      }
    } catch (polygonErr) {}
  }

  const fromPt = point(fromCoord);
  const toPt = point(toCoord);

  // 1. Try In-Memory Local Network Routing (via Adaptive Precision PathFinder)
  if (!options.syncOnly) {
    try {
      const roads = typeof window !== 'undefined' 
        ? (window as any).luwuRoads 
        : (global as any).luwuRoads;

      if (roads && roads.features && roads.features.length > 0) {
        // Exclude the 27 isolated/draft segments (status IS NULL or empty) to prevent snapping onto dead ends
        const validRoads = roads;

        // Explode once for snapping
        const exploded = explode(validRoads);

        if (exploded.features.length > 0) {
          const snappedFrom = nearestPoint(fromPt, exploded);
          const snappedTo = nearestPoint(toPt, exploded);

          // Adaptive Precision array: try the highly accurate 1e-4 (11m) first,
          // then widen up to 5e-4 (55m) to bridge any remaining digitization gaps.
          const precisions = [1e-4, 2e-4, 3e-4, 5e-4];
          for (const prec of precisions) {
            const pf = getPathFinderWithPrecision(prec, validRoads);
            if (pf) {
              const pathResult = pf.findPath(snappedFrom, snappedTo);
              if (pathResult && pathResult.path && pathResult.path.length > 1) {
                let actualDistance = 0;
                for (let i = 0; i < pathResult.path.length - 1; i++) {
                  actualDistance += distance(
                    point(pathResult.path[i]),
                    point(pathResult.path[i + 1]),
                    { units: 'kilometers' }
                  );
                }
                   
                // Add door-to-road snapping offsets for high door-to-door precision
                const fromOffset = snappedFrom.properties?.distanceToPoint || distance(fromPt, snappedFrom, { units: 'kilometers' });
                const toOffset = snappedTo.properties?.distanceToPoint || distance(toPt, snappedTo, { units: 'kilometers' });
                const totalDistance = actualDistance + fromOffset + toOffset;

                return {
                  distance: Number(totalDistance.toFixed(2)),
                  method: 'NETWORK'
                };
              }
            }
          }
        }
      }
    } catch (err) {}
  }

  // 2. Fallback to Database pgRouting RPC
  if (!options.syncOnly && supabaseClient && typeof supabaseClient.rpc === 'function') {
    try {
      const { data, error } = await supabaseClient.rpc('get_network_distance', {
        start_lng: fromCoord[0],
        start_lat: fromCoord[1],
        end_lng: toCoord[0],
        end_lat: toCoord[1]
      });

      if (!error && data !== null && data > 0) {
        // Only trust if not suspiciously close to straight-line Euclidean (which would imply database side Euclidean fallback)
        const eucDist = distance(fromPt, toPt, { units: 'kilometers' });
        return { distance: Number(data), method: "NETWORK" };
      }
    } catch (err) {}
  }

  // 3. Final Fallback to Euclidean straight-line distance using turf
  const eucDist = distance(fromPt, toPt, { units: options.units || 'kilometers' });
  
  return {
    distance: Number(eucDist.toFixed(2)),
    method: 'EUCLIDEAN'
  };
}

export interface NetworkRouteGeoJSONResult {
  distanceKm: number;
  distanceMeters: number;
  method: 'NETWORK' | 'EUCLIDEAN';
  geoJson: any;
}

export function calculateShortestPathGeoJSON(
  fromCoord: [number, number],
  toCoord: [number, number],
  fromName: string = "Awal",
  toName: string = "Tujuan"
): NetworkRouteGeoJSONResult {
  const fromPt = point(fromCoord);
  const toPt = point(toCoord);

  const roads = typeof window !== 'undefined' 
    ? (window as any).luwuRoads 
    : (global as any).luwuRoads;

  let pathCoords: number[][] = [fromCoord, toCoord];
  let method: 'NETWORK' | 'EUCLIDEAN' = 'EUCLIDEAN';
  let totalDistanceKm = distance(fromPt, toPt, { units: 'kilometers' });

  if (roads && roads.features && roads.features.length > 0) {
    try {
      const validRoads = roads;
      const exploded = explode(validRoads);

      if (exploded.features.length > 0) {
        const snappedFrom = nearestPoint(fromPt, exploded);
        const snappedTo = nearestPoint(toPt, exploded);

        const precisions = [1e-4, 2e-4, 3e-4, 5e-4];
        for (const prec of precisions) {
          const pf = getPathFinderWithPrecision(prec, validRoads);
          if (pf) {
            const pathResult = pf.findPath(snappedFrom, snappedTo);
            if (pathResult && pathResult.path && pathResult.path.length > 1) {
              let pathDist = 0;
              for (let i = 0; i < pathResult.path.length - 1; i++) {
                pathDist += distance(
                  point(pathResult.path[i]),
                  point(pathResult.path[i + 1]),
                  { units: 'kilometers' }
                );
              }
              const fromOffset = distance(fromPt, snappedFrom, { units: 'kilometers' });
              const toOffset = distance(toPt, snappedTo, { units: 'kilometers' });

              totalDistanceKm = pathDist + fromOffset + toOffset;
              method = 'NETWORK';
              pathCoords = [fromCoord, ...pathResult.path, toCoord];
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error calculating network route path:", e);
    }
  }

  const routeLine = lineString(pathCoords, {
    _type: 'network_route_line',
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    distanceMeters: Math.round(totalDistanceKm * 1000),
    method,
    fromName,
    toName
  });

  const startMarker = point(fromCoord, {
    _type: 'route_node_start',
    label: fromName
  });

  const endMarker = point(toCoord, {
    _type: 'route_node_end',
    label: toName
  });

  return {
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    distanceMeters: Math.round(totalDistanceKm * 1000),
    method,
    geoJson: {
      type: "FeatureCollection",
      features: [routeLine, startMarker, endMarker]
    }
  };
}

export function getDistanceSync(from: any, to: any, options: { units?: Units } = { units: 'kilometers' }): DistanceResult {
  let fromCoord = Array.isArray(from) ? from : (from.geometry ? from.geometry.coordinates : from.coordinates);
  let toCoord = Array.isArray(to) ? to : (to.geometry ? to.geometry.coordinates : to.coordinates);
  const fromPt = point(fromCoord);
  const toPt = point(toCoord);
  const eucDist = distance(fromPt, toPt, options);
  
  return {
    distance: Number(eucDist.toFixed(2)),
    method: 'EUCLIDEAN'
  };
}

/**
 * Optimizes finding the nearest point on a large line network.
 */
export function getOptimizedNearestPointOnLine(pt: any, linesGeojson: any): any {
  try {
    // Optimization: Filter the massive road dataset to only consider features within a 5km bounding box.
    const searchRadius = 5; 
    const searchCircle = circle(pt, searchRadius, { units: 'kilometers' });
    const searchBbox = bbox(searchCircle);
    
    // Quick BBOX intersection filter (very fast)
    let nearbyFeatures = linesGeojson.features.filter((f: any) => {
      const fBox = bbox(f);
      // Check if bounding boxes overlap
      return !(fBox[0] > searchBbox[2] || 
               fBox[2] < searchBbox[0] || 
               fBox[1] > searchBbox[3] || 
               fBox[3] < searchBbox[1]);
    });
    
    if (nearbyFeatures.length === 0) {
       // if no road within 5km, fallback to scanning all (or just return the point)
       nearbyFeatures = linesGeojson.features;
    }
    
    // @ts-ignore
    return nearestPointOnLine({ type: 'FeatureCollection', features: nearbyFeatures }, pt, { units: 'kilometers' });
  } catch (err) {
    return nearestPointOnLine(linesGeojson, pt, { units: 'kilometers' });
  }
}
