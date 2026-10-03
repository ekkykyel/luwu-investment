/**
 * WEB WORKER: SPATIAL VECTOR TILING & GEOJSON PARTITIONER
 * 
 * Offloads JSON parsing, bounding box calculation, and spatial grid queries
 * to a dedicated background worker thread, ensuring the main UI thread
 * remains completely unblocked at 60 FPS.
 */

interface WorkerIndexedFeature {
  feature: any;
  bbox: [number, number, number, number];
}

interface WorkerSpatialIndex {
  layerId: string;
  totalFeatures: number;
  indexedFeatures: WorkerIndexedFeature[];
  globalBbox: [number, number, number, number];
  cellSize: number;
  grid: Map<string, number[]>;
}

const indices = new Map<string, WorkerSpatialIndex>();

function computeGeometryBbox(geom: any): [number, number, number, number] | null {
  if (!geom || !geom.coordinates) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const traverse = (coords: any) => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = coords[0];
      const lat = coords[1];
      if (!isNaN(lng) && !isNaN(lat)) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    } else {
      for (let i = 0; i < coords.length; i++) {
        traverse(coords[i]);
      }
    }
  };

  traverse(geom.coordinates);

  if (minLng === Infinity || minLat === Infinity) return null;
  return [minLng, minLat, maxLng, maxLat];
}

function bboxesIntersect(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function expandBbox(bbox: [number, number, number, number], marginRatio: number = 0.25): [number, number, number, number] {
  const width = Math.max(bbox[2] - bbox[0], 0.01);
  const height = Math.max(bbox[3] - bbox[1], 0.01);
  const dx = width * marginRatio;
  const dy = height * marginRatio;
  return [bbox[0] - dx, bbox[1] - dy, bbox[2] + dx, bbox[3] + dy];
}

function buildIndex(layerId: string, features: any[], cellSize: number = 0.05): WorkerSpatialIndex {
  const indexedFeatures: WorkerIndexedFeature[] = [];
  const grid = new Map<string, number[]>();

  let globalMinLng = Infinity;
  let globalMinLat = Infinity;
  let globalMaxLng = -Infinity;
  let globalMaxLat = -Infinity;

  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    if (!feat || !feat.geometry) continue;

    const bbox: [number, number, number, number] | null = Array.isArray(feat.bbox) && feat.bbox.length === 4
      ? feat.bbox
      : computeGeometryBbox(feat.geometry);

    if (!bbox) continue;

    const idx = indexedFeatures.length;
    indexedFeatures.push({ feature: feat, bbox });

    if (bbox[0] < globalMinLng) globalMinLng = bbox[0];
    if (bbox[1] < globalMinLat) globalMinLat = bbox[1];
    if (bbox[2] > globalMaxLng) globalMaxLng = bbox[2];
    if (bbox[3] > globalMaxLat) globalMaxLat = bbox[3];

    const startX = Math.floor(bbox[0] / cellSize);
    const endX = Math.floor(bbox[2] / cellSize);
    const startY = Math.floor(bbox[1] / cellSize);
    const endY = Math.floor(bbox[3] / cellSize);

    const maxSpan = 15;
    const clampedEndX = Math.min(endX, startX + maxSpan);
    const clampedEndY = Math.min(endY, startY + maxSpan);

    for (let gx = startX; gx <= clampedEndX; gx++) {
      for (let gy = startY; gy <= clampedEndY; gy++) {
        const key = `${gx}:${gy}`;
        const cell = grid.get(key);
        if (cell) {
          cell.push(idx);
        } else {
          grid.set(key, [idx]);
        }
      }
    }
  }

  const globalBbox: [number, number, number, number] = globalMinLng !== Infinity
    ? [globalMinLng, globalMinLat, globalMaxLng, globalMaxLat]
    : [119.5, -3.8, 120.8, -2.0];

  const index: WorkerSpatialIndex = {
    layerId,
    totalFeatures: indexedFeatures.length,
    indexedFeatures,
    globalBbox,
    cellSize,
    grid
  };

  indices.set(layerId, index);
  return index;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    switch (type) {
      case 'FETCH_AND_INDEX': {
        const { layerId, url, cellSize } = payload;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        const data = await res.json();
        const features = data?.features || (data?.type === 'Feature' ? [data] : []);
        const index = buildIndex(layerId, features, cellSize);

        self.postMessage({
          id,
          success: true,
          type: 'INDEX_READY',
          payload: {
            layerId,
            totalFeatures: index.totalFeatures,
            globalBbox: index.globalBbox
          }
        });
        break;
      }

      case 'INDEX_GEOJSON': {
        const { layerId, geojson, cellSize } = payload;
        const features = geojson?.features || (geojson?.type === 'Feature' ? [geojson] : []);
        const index = buildIndex(layerId, features, cellSize);

        self.postMessage({
          id,
          success: true,
          type: 'INDEX_READY',
          payload: {
            layerId,
            totalFeatures: index.totalFeatures,
            globalBbox: index.globalBbox
          }
        });
        break;
      }

      case 'QUERY_VIEWPORT': {
        const { layerId, viewportBbox, marginRatio = 0.25, zoomLevel = 10, maxFeatures = 20000 } = payload;
        const index = indices.get(layerId);

        if (!index) {
          self.postMessage({
            id,
            success: false,
            error: `Layer index not found: ${layerId}`
          });
          return;
        }

        // Fast path for low zoom levels
        if (zoomLevel <= 9 && index.totalFeatures <= 3000) {
          const allFeatures = index.indexedFeatures.map(item => item.feature);
          self.postMessage({
            id,
            success: true,
            type: 'VIEWPORT_FEATURES',
            payload: {
              layerId,
              featureCount: allFeatures.length,
              geojson: { type: 'FeatureCollection', features: allFeatures }
            }
          });
          return;
        }

        const bufferedBbox = expandBbox(viewportBbox, marginRatio);
        const startX = Math.floor(bufferedBbox[0] / index.cellSize);
        const endX = Math.floor(bufferedBbox[2] / index.cellSize);
        const startY = Math.floor(bufferedBbox[1] / index.cellSize);
        const endY = Math.floor(bufferedBbox[3] / index.cellSize);

        const matchedIndices = new Set<number>();

        for (let gx = startX; gx <= endX; gx++) {
          for (let gy = startY; gy <= endY; gy++) {
            const cell = index.grid.get(`${gx}:${gy}`);
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
              const featIdx = cell[i];
              if (matchedIndices.has(featIdx)) continue;

              const item = index.indexedFeatures[featIdx];
              if (bboxesIntersect(item.bbox, bufferedBbox)) {
                matchedIndices.add(featIdx);
                if (matchedIndices.size >= maxFeatures) break;
              }
            }
            if (matchedIndices.size >= maxFeatures) break;
          }
          if (matchedIndices.size >= maxFeatures) break;
        }

        const matchedFeatures: any[] = [];
        for (const idx of matchedIndices) {
          matchedFeatures.push(index.indexedFeatures[idx].feature);
        }

        self.postMessage({
          id,
          success: true,
          type: 'VIEWPORT_FEATURES',
          payload: {
            layerId,
            featureCount: matchedFeatures.length,
            geojson: { type: 'FeatureCollection', features: matchedFeatures }
          }
        });
        break;
      }

      case 'CLEAR_LAYER': {
        const { layerId } = payload;
        indices.delete(layerId);
        self.postMessage({ id, success: true });
        break;
      }

      default:
        self.postMessage({ id, success: false, error: `Unknown message type: ${type}` });
    }
  } catch (err: any) {
    self.postMessage({
      id,
      success: false,
      error: err?.message || 'Worker processing error'
    });
  }
};
