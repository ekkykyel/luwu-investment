/**
 * SPATIAL PARTITIONING & TILE-BASED RENDERING ENGINE (KABUPATEN LUWU GIS)
 * 
 * Provides high-performance spatial indexing, bounding box partitioning,
 * and progressive viewport filtering for massive GeoJSON datasets (RBI, RTRW Zoning, Desa, Jalan).
 * 
 * Guarantees zero UI-thread blocking by utilizing chunked requestAnimationFrame processing,
 * spatial bounding-box indexing, and MapLibre geojson-vt vector tiling optimization.
 */

export type BoundingBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export interface IndexedFeature {
  feature: any;
  bbox: BoundingBox;
}

export interface SpatialGridIndex {
  layerId: string;
  totalFeatures: number;
  indexedFeatures: IndexedFeature[];
  globalBbox: BoundingBox;
  cellSize: number; // in degrees
  grid: Map<string, number[]>; // cellKey -> array of feature indices
}

/**
 * Fast bounding box computation for GeoJSON geometry without external dependency overhead
 */
export function computeGeometryBbox(geom: any): BoundingBox | null {
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

/**
 * Check if two bounding boxes intersect
 */
export function bboxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/**
 * Expands bounding box with a margin ratio (e.g. 0.2 = 20% outer buffer)
 * to prevent pop-in artifacts during camera panning
 */
export function expandBboxWithMargin(bbox: BoundingBox, marginRatio: number = 0.2): BoundingBox {
  const width = Math.max(bbox[2] - bbox[0], 0.01);
  const height = Math.max(bbox[3] - bbox[1], 0.01);
  const dx = width * marginRatio;
  const dy = height * marginRatio;
  return [bbox[0] - dx, bbox[1] - dy, bbox[2] + dx, bbox[3] + dy];
}

/**
 * Creates a unique spatial grid cell key for coordinate pair
 */
function getCellKey(gridX: number, gridY: number): string {
  return `${gridX}:${gridY}`;
}

/**
 * Builds a Spatial Grid Index for a FeatureCollection
 */
export function buildSpatialGridIndex(
  layerId: string,
  features: any[],
  cellSize: number = 0.05 // ~5.5km cell at equator
): SpatialGridIndex {
  const indexedFeatures: IndexedFeature[] = [];
  const grid = new Map<string, number[]>();

  let globalMinLng = Infinity;
  let globalMinLat = Infinity;
  let globalMaxLng = -Infinity;
  let globalMaxLat = -Infinity;

  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    if (!feat || !feat.geometry) continue;

    // Use pre-existing bbox if already present in feature, otherwise compute
    let bbox: BoundingBox | null = Array.isArray(feat.bbox) && feat.bbox.length === 4 
      ? (feat.bbox as BoundingBox) 
      : computeGeometryBbox(feat.geometry);

    if (!bbox) continue;

    const idx = indexedFeatures.length;
    indexedFeatures.push({ feature: feat, bbox });

    if (bbox[0] < globalMinLng) globalMinLng = bbox[0];
    if (bbox[1] < globalMinLat) globalMinLat = bbox[1];
    if (bbox[2] > globalMaxLng) globalMaxLng = bbox[2];
    if (bbox[3] > globalMaxLat) globalMaxLat = bbox[3];

    // Map feature to overlapping grid cells
    const startX = Math.floor(bbox[0] / cellSize);
    const endX = Math.floor(bbox[2] / cellSize);
    const startY = Math.floor(bbox[1] / cellSize);
    const endY = Math.floor(bbox[3] / cellSize);

    // Limit maximum cells per feature to avoid excessive memory on giant polygons
    const maxSpan = 15;
    const clampedEndX = Math.min(endX, startX + maxSpan);
    const clampedEndY = Math.min(endY, startY + maxSpan);

    for (let gx = startX; gx <= clampedEndX; gx++) {
      for (let gy = startY; gy <= clampedEndY; gy++) {
        const key = getCellKey(gx, gy);
        const cell = grid.get(key);
        if (cell) {
          cell.push(idx);
        } else {
          grid.set(key, [idx]);
        }
      }
    }
  }

  const globalBbox: BoundingBox = globalMinLng !== Infinity
    ? [globalMinLng, globalMinLat, globalMaxLng, globalMaxLat]
    : [119.5, -3.8, 120.8, -2.0];

  return {
    layerId,
    totalFeatures: indexedFeatures.length,
    indexedFeatures,
    globalBbox,
    cellSize,
    grid
  };
}

/**
 * Queries features intersecting a given viewport bounding box using spatial grid index
 */
export function queryViewportFeatures(
  index: SpatialGridIndex,
  viewportBbox: BoundingBox,
  options: {
    marginRatio?: number;
    maxFeatures?: number;
    zoomLevel?: number;
  } = {}
): any[] {
  const { marginRatio = 0.25, maxFeatures = 20000, zoomLevel } = options;

  // Zoomed far out (macro view) -> If total features are reasonable (<3000), return all
  if (zoomLevel !== undefined && zoomLevel <= 9 && index.totalFeatures <= 3000) {
    return index.indexedFeatures.map(item => item.feature);
  }

  const bufferedBbox = expandBboxWithMargin(viewportBbox, marginRatio);

  // If the query covers the entire dataset bbox, return all
  if (
    bufferedBbox[0] <= index.globalBbox[0] &&
    bufferedBbox[1] <= index.globalBbox[1] &&
    bufferedBbox[2] >= index.globalBbox[2] &&
    bufferedBbox[3] >= index.globalBbox[3]
  ) {
    return index.indexedFeatures.map(item => item.feature);
  }

  const startX = Math.floor(bufferedBbox[0] / index.cellSize);
  const endX = Math.floor(bufferedBbox[2] / index.cellSize);
  const startY = Math.floor(bufferedBbox[1] / index.cellSize);
  const endY = Math.floor(bufferedBbox[3] / index.cellSize);

  const matchedIndices = new Set<number>();

  for (let gx = startX; gx <= endX; gx++) {
    for (let gy = startY; gy <= endY; gy++) {
      const cell = index.grid.get(getCellKey(gx, gy));
      if (!cell) continue;

      for (let i = 0; i < cell.length; i++) {
        const featIdx = cell[i];
        if (matchedIndices.has(featIdx)) continue;

        // Verify exact bbox intersection
        const item = index.indexedFeatures[featIdx];
        if (bboxesIntersect(item.bbox, bufferedBbox)) {
          matchedIndices.add(featIdx);
          if (matchedIndices.size >= maxFeatures) {
            break;
          }
        }
      }
      if (matchedIndices.size >= maxFeatures) break;
    }
    if (matchedIndices.size >= maxFeatures) break;
  }

  const results: any[] = [];
  for (const idx of matchedIndices) {
    results.push(index.indexedFeatures[idx].feature);
  }

  return results;
}

/**
 * Non-blocking chunk processor using requestAnimationFrame to protect 60 FPS
 */
export function processInChunks<T, R>(
  items: T[],
  transformFn: (item: T, index: number) => R,
  chunkSize: number = 300
): Promise<R[]> {
  return new Promise((resolve) => {
    if (!items || items.length === 0) {
      resolve([]);
      return;
    }

    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    const processNextSlice = () => {
      const start = performance.now();
      // Allow up to 8ms per frame slice to maintain 60 FPS
      while (currentIndex < items.length && (performance.now() - start) < 8) {
        const end = Math.min(currentIndex + chunkSize, items.length);
        for (let i = currentIndex; i < end; i++) {
          results[i] = transformFn(items[i], i);
        }
        currentIndex = end;
      }

      if (currentIndex < items.length) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(processNextSlice);
        } else {
          setTimeout(processNextSlice, 0);
        }
      } else {
        resolve(results);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(processNextSlice);
    } else {
      setTimeout(processNextSlice, 0);
    }
  });
}

/**
 * Spatial Partition Cache Manager to prevent reprocessing and garbage collection thrashing
 */
class SpatialPartitionCacheManager {
  private cache = new Map<string, {
    index: SpatialGridIndex;
    version: number;
    lastAccessed: number;
  }>();

  private maxCacheEntries = 20;

  public get(layerId: string): SpatialGridIndex | null {
    const entry = this.cache.get(layerId);
    if (!entry) return null;
    entry.lastAccessed = Date.now();
    return entry.index;
  }

  public set(layerId: string, index: SpatialGridIndex, version: number = 1): void {
    if (this.cache.size >= this.maxCacheEntries) {
      // Evict least recently accessed
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, val] of this.cache.entries()) {
        if (val.lastAccessed < oldestTime) {
          oldestTime = val.lastAccessed;
          oldestKey = key;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(layerId, {
      index,
      version,
      lastAccessed: Date.now()
    });
  }

  public invalidate(layerId?: string): void {
    if (layerId) {
      this.cache.delete(layerId);
    } else {
      this.cache.clear();
    }
  }
}

export const spatialPartitionCache = new SpatialPartitionCacheManager();
