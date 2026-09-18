// Turf Shim to avoid compiling 3000+ Turf modules and causing Out-Of-Memory errors
// Loads Turf from global window object (loaded via script tag in index.html)

const getGlobalTurf = () => {
  if (typeof window !== "undefined" && (window as any).turf) {
    return (window as any).turf;
  }
  // Safe mock for SSR or during initialization before script loaded
  return {
    point: (coords: any, properties?: any) => ({ type: "Feature", geometry: { type: "Point", coordinates: coords }, properties: properties || {} }),
    centroid: (feat: any) => ({ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] } }),
    lineString: (coords: any, properties?: any) => ({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: properties || {} }),
    booleanPointInPolygon: () => false,
    polygon: (coords: any, properties?: any) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: coords }, properties: properties || {} }),
    multiPolygon: (coords: any, properties?: any) => ({ type: "Feature", geometry: { type: "MultiPolygon", coordinates: coords }, properties: properties || {} }),
    bbox: () => [0, 0, 0, 0],
    bboxPolygon: (bbox: number[]) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]]
        ]]
      },
      properties: {}
    }),
    area: () => 0,
    length: () => 0,
    feature: (geom: any, properties?: any) => ({ type: "Feature", geometry: geom, properties: properties || {} }),
    polygonToLine: (feat: any) => ({ type: "Feature", geometry: { type: "LineString", coordinates: [] } }),
    centerOfMass: () => ({ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] } }),
    booleanWithin: () => false,
    center: () => ({ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] } }),
    buffer: (feat: any, radius: number, options?: any) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [] } }),
    distance: () => 0,
    circle: (center: any, radius: number, options?: any) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [] } }),
    nearestPointOnLine: () => ({ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] } }),
    booleanClockwise: () => false,
    booleanIntersects: () => false,
    intersect: () => null,
  };
};

const turfProxy = new Proxy({}, {
  get: (target, prop) => {
    const globalTurf = getGlobalTurf();
    if (globalTurf && globalTurf[prop] !== undefined) {
      if (typeof globalTurf[prop] === "function") {
        return globalTurf[prop].bind(globalTurf);
      }
      return globalTurf[prop];
    }
    // Fallback Mock
    const mock = (getGlobalTurf() as any)[prop];
    if (typeof mock === "function") {
      return mock;
    }
    
    // Ultimate failsafe: return a dummy function so it never throws "is not a function"
    return () => null;
  }
});

export const point = (coords: any, properties?: any) => (turfProxy as any).point(coords, properties);
export const centroid = (feat: any) => (turfProxy as any).centroid(feat);
export const lineString = (coords: any, properties?: any) => (turfProxy as any).lineString(coords, properties);
export const booleanPointInPolygon = (pt: any, poly: any) => (turfProxy as any).booleanPointInPolygon(pt, poly);
export const polygon = (coords: any, properties?: any) => (turfProxy as any).polygon(coords, properties);
export const multiPolygon = (coords: any, properties?: any) => (turfProxy as any).multiPolygon(coords, properties);
export const bbox = (feat: any) => (turfProxy as any).bbox(feat);
export const bboxPolygon = (bbox: any) => (turfProxy as any).bboxPolygon(bbox);
export const area = (feat: any) => (turfProxy as any).area(feat);
export const length = (feat: any, options?: any) => (turfProxy as any).length(feat, options);
export const feature = (geom: any, properties?: any) => (turfProxy as any).feature(geom, properties);
export const polygonToLine = (feat: any, options?: any) => (turfProxy as any).polygonToLine(feat, options);
export const centerOfMass = (feat: any, options?: any) => (turfProxy as any).centerOfMass(feat, options);
export const booleanWithin = (feat1: any, feat2: any) => (turfProxy as any).booleanWithin(feat1, feat2);
export const center = (feat: any, options?: any) => (turfProxy as any).center(feat, options);
export const buffer = (feat: any, radius: number, options?: any) => (turfProxy as any).buffer(feat, radius, options);
export const distance = (from: any, to: any, options?: any) => (turfProxy as any).distance(from, to, options);
export const circle = (center: any, radius: number, options?: any) => (turfProxy as any).circle(center, radius, options);
export const nearestPointOnLine = (lines: any, pt: any, options?: any) => (turfProxy as any).nearestPointOnLine(lines, pt, options);
export const booleanIntersects = (feat1: any, feat2: any) => (turfProxy as any).booleanIntersects(feat1, feat2);
export const intersect = (features: any) => (turfProxy as any).intersect(features);
export const cleanCoords = (feat: any) => (turfProxy as any).cleanCoords(feat);
export const truncate = (feat: any, options?: any) => (turfProxy as any).truncate(feat, options);
export const union = (features: any) => (turfProxy as any).union(features);
export const featureEach = (geojson: any, callback: any) => (turfProxy as any).featureEach(geojson, callback);

export default turfProxy as any;

export const featureCollection = (features: any[]) => (turfProxy as any).featureCollection(features);
export const pointToLineDistance = (pt: any, line: any, options?: any) => (turfProxy as any).pointToLineDistance(pt, line, options);
export const coordEach = (geojson: any, callback: any) => (turfProxy as any).coordEach(geojson, callback);
export const simplify = (geojson: any, options?: any) => (turfProxy as any).simplify(geojson, options);
export const difference = (features: any) => (turfProxy as any).difference(features);
export const kinks = (feature: any) => (turfProxy as any).kinks(feature);
export const midpoint = (pt1: any, pt2: any) => (turfProxy as any).midpoint(pt1, pt2);
export const explode = (feature: any) => (turfProxy as any).explode(feature);
export const nearestPoint = (targetPoint: any, points: any) => (turfProxy as any).nearestPoint(targetPoint, points);
export const booleanClockwise = (line: any) => (turfProxy as any).booleanClockwise(line);
export const pointOnFeature = (feat: any) => (turfProxy as any).pointOnFeature(feat);
