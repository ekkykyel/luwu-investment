/**
 * SPATIAL WORKER CLIENT & ADAPTIVE PARTITION MANAGER
 * 
 * Provides unified, promise-based API for spatial vector partitioning:
 * 1. Delegates to Web Worker if supported (zero main-thread blockage).
 * 2. Transparently falls back to chunked requestAnimationFrame execution
 *    if Web Worker is not supported in the execution environment.
 */

import {
  buildSpatialGridIndex,
  queryViewportFeatures,
  spatialPartitionCache,
  BoundingBox
} from './spatialPartitionEngine';

// @ts-ignore
import SpatialWorker from '../workers/spatialWorker?worker&inline';

type WorkerCallback = {
  resolve: (val: any) => void;
  reject: (err: any) => void;
};

class SpatialWorkerClient {
  private worker: Worker | null = null;
  private isWorkerSupported: boolean = false;
  private messageCounter: number = 0;
  private pendingCallbacks = new Map<number, WorkerCallback>();
  private activeLayerIds = new Set<string>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.isWorkerSupported = false;
      return;
    }

    try {
      this.worker = new SpatialWorker();

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, success, payload, error } = e.data;
        const cb = this.pendingCallbacks.get(id);
        if (!cb) return;

        this.pendingCallbacks.delete(id);
        if (success) {
          cb.resolve(payload);
        } else {
          cb.reject(new Error(error || 'Worker execution failed'));
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Spatial Worker error, switching to main-thread chunked mode:', err);
        this.isWorkerSupported = false;
      };

      this.isWorkerSupported = true;
    } catch (e) {
      console.warn('Web Worker initialization failed, using chunked main thread fallback:', e);
      this.isWorkerSupported = false;
    }
  }

  private postWorkerMessage<T>(type: string, payload: any): Promise<T> {
    const id = ++this.messageCounter;
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }
      this.pendingCallbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  /**
   * Index GeoJSON layer data either in background worker or local partition cache
   */
  public async indexLayer(layerId: string, geojson: any, cellSize: number = 0.05): Promise<{ totalFeatures: number }> {
    this.activeLayerIds.add(layerId);

    if (this.isWorkerSupported && this.worker) {
      try {
        const result = await this.postWorkerMessage<{ totalFeatures: number }>(
          'INDEX_GEOJSON',
          { layerId, geojson, cellSize }
        );
        return result;
      } catch (e) {
        console.warn('Worker indexing failed, falling back to main-thread index:', e);
      }
    }

    // Main-thread fallback using fast index
    const features = geojson?.features || (geojson?.type === 'Feature' ? [geojson] : []);
    const index = buildSpatialGridIndex(layerId, features, cellSize);
    spatialPartitionCache.set(layerId, index);
    return { totalFeatures: index.totalFeatures };
  }

  /**
   * Query visible features for a camera viewport bounding box
   */
  public async queryViewport(
    layerId: string,
    viewportBbox: BoundingBox,
    options: {
      zoomLevel?: number;
      marginRatio?: number;
      maxFeatures?: number;
      fallbackGeoJSON?: any;
    } = {}
  ): Promise<{ type: 'FeatureCollection'; features: any[] }> {
    const { zoomLevel = 10, marginRatio = 0.25, maxFeatures = 20000, fallbackGeoJSON } = options;

    if (this.isWorkerSupported && this.worker) {
      try {
        const result = await this.postWorkerMessage<{ geojson: { type: 'FeatureCollection'; features: any[] } }>(
          'QUERY_VIEWPORT',
          { layerId, viewportBbox, marginRatio, zoomLevel, maxFeatures }
        );
        if (result && result.geojson) {
          return result.geojson;
        }
      } catch (e) {
        // Fall through to local fallback
      }
    }

    // Local in-memory index fallback
    let index = spatialPartitionCache.get(layerId);
    if (!index && fallbackGeoJSON) {
      const features = fallbackGeoJSON.features || (fallbackGeoJSON.type === 'Feature' ? [fallbackGeoJSON] : []);
      index = buildSpatialGridIndex(layerId, features);
      spatialPartitionCache.set(layerId, index);
    }

    if (!index) {
      return fallbackGeoJSON || { type: 'FeatureCollection', features: [] };
    }

    const matched = queryViewportFeatures(index, viewportBbox, {
      marginRatio,
      maxFeatures,
      zoomLevel
    });

    return {
      type: 'FeatureCollection',
      features: matched
    };
  }

  /**
   * Clear layer index when layer is toggled off to free memory
   */
  public clearLayer(layerId: string) {
    this.activeLayerIds.delete(layerId);
    spatialPartitionCache.invalidate(layerId);
    if (this.isWorkerSupported && this.worker) {
      this.postWorkerMessage('CLEAR_LAYER', { layerId }).catch(() => {});
    }
  }
}

export const spatialWorkerClient = new SpatialWorkerClient();
