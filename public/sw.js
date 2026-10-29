// Service Worker: GeoJSON & Spatial Cache Layer with SWR / TTL Strategy
// Powered by Workbox with robust Native SWR Fallback

const isDevOrPreview = self.location.hostname.includes('localhost') || 
                      self.location.hostname.includes('127.0.0.1') || 
                      self.location.hostname.includes('run.app') ||
                      self.location.hostname.includes('ais-dev') ||
                      self.location.hostname.includes('ais-pre');

if (isDevOrPreview) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
} else {

const APP_CACHE_NAME = 'luwu-invest-v8';
const SPATIAL_CACHE_NAME = 'geojson-spatial-cache-v4';
const STATIC_ASSETS_CACHE = 'static-assets-cache-v4';
const APP_SHELL_CACHE = 'app-shell-cache-v4';
const SPATIAL_MAX_ENTRIES = 30;
const SPATIAL_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 hari TTL

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Try loading Workbox from CDN
let isWorkboxReady = false;
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');
  if (typeof workbox !== 'undefined') {
    isWorkboxReady = true;
  }
} catch (e) {
  console.info('[SW] Workbox CDN offline/skipped, using native SWR Spatial Cache engine.');
}

if (isWorkboxReady) {
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;

  // 1. GEOJSON & SPATIAL DATA SWR CACHE LAYER
  registerRoute(
    ({ url }) =>
      (url.origin === self.location.origin) &&
      !url.pathname.startsWith('/api/tiles/') &&
      !url.pathname.endsWith('.pbf') &&
      (
        url.pathname.endsWith('.geojson') ||
        url.pathname.includes('/spatial/') ||
        url.pathname.startsWith('/api/spatial-layers') ||
        url.pathname.includes('gis_') ||
        (url.pathname.endsWith('.json') && url.pathname.includes('gis'))
      ),
    new StaleWhileRevalidate({
      cacheName: SPATIAL_CACHE_NAME,
      plugins: [
        new ExpirationPlugin({
          maxEntries: SPATIAL_MAX_ENTRIES,
          maxAgeSeconds: SPATIAL_MAX_AGE_SECONDS,
          purgeOnQuotaError: true
        }),
        new CacheableResponsePlugin({
          statuses: [200]
        })
      ]
    })
  );

  // 2. Static Assets & Production Chunks (CacheFirst - strictly /assets/ only, NEVER node_modules or dev)
  registerRoute(
    ({ request, url }) =>
      url.origin === self.location.origin && 
      !url.pathname.includes('node_modules') &&
      !url.pathname.startsWith('/src/') &&
      !url.pathname.includes('/@') &&
      (
        url.pathname.startsWith('/assets/') ||
        request.destination === 'font' ||
        request.destination === 'image'
      ),
    new CacheFirst({
      cacheName: STATIC_ASSETS_CACHE,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }),
        new CacheableResponsePlugin({
          statuses: [200]
        })
      ]
    })
  );

  // 3. Document / App Shell (NetworkFirst)
  registerRoute(
    ({ request, url }) => url.origin === self.location.origin && (request.mode === 'navigate' || request.destination === 'document'),
    new NetworkFirst({
      cacheName: APP_SHELL_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        })
      ]
    })
  );

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== APP_CACHE_NAME && key !== SPATIAL_CACHE_NAME && key !== STATIC_ASSETS_CACHE && key !== APP_SHELL_CACHE) {
              console.log('[SW] Deleting obsolete cache:', key);
              return caches.delete(key);
            }
          })
        )
      ).then(() => self.clients.claim())
    );
  });
} else {
  // NATIVE SERVICE WORKER SWR & TTL SPATIAL ENGINE
  const staticUrls = ['/', '/index.html', '/manifest.json', '/icon.svg', '/turf.min.js'];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(APP_CACHE_NAME).then((cache) => cache.addAll(staticUrls).catch(() => {}))
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== APP_CACHE_NAME && key !== SPATIAL_CACHE_NAME && key !== STATIC_ASSETS_CACHE && key !== APP_SHELL_CACHE) {
              return caches.delete(key).catch(() => {});
            }
          })
        )
      ).then(() => self.clients.claim())
    );
  });

  function isSpatialRequest(url) {
    return (
      url.origin === self.location.origin &&
      (
        url.pathname.endsWith('.geojson') ||
        url.pathname.includes('/spatial/') ||
        url.pathname.startsWith('/api/spatial-layers') ||
        url.pathname.startsWith('/api/tiles/') ||
        url.pathname.includes('gis_') ||
        (url.pathname.endsWith('.json') && url.pathname.includes('gis'))
      )
    );
  }

  // Metadata cache for native TTL tracking
  const spatialMetaMap = new Map();

  async function handleSpatialSWR(request) {
    try {
      const cache = await caches.open(SPATIAL_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      const urlKey = request.url;
      const now = Date.now();

      // Background fetch & update
      const networkFetchPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            try {
              const cloned = networkResponse.clone();
              await cache.put(request, cloned);
              spatialMetaMap.set(urlKey, now);

              // Enforce maxEntries: 30
              const keys = await cache.keys();
              if (keys.length > SPATIAL_MAX_ENTRIES) {
                const oldestKey = keys[0];
                await cache.delete(oldestKey).catch(() => {});
                spatialMetaMap.delete(oldestKey.url);
              }
            } catch (cacheErr) {
              // Ignore transient cache put/quota errors
            }
          }
          return networkResponse;
        })
        .catch((err) => {
          return cachedResponse;
        });

      // Check if cached version is within TTL (7 days)
      if (cachedResponse) {
        const cachedTime = spatialMetaMap.get(urlKey) || now;
        const isExpired = (now - cachedTime) > (SPATIAL_MAX_AGE_SECONDS * 1000);

        if (!isExpired) {
          return cachedResponse;
        }
      }

      const res = await networkFetchPromise;
      if (res) return res;
      if (cachedResponse) return cachedResponse;
      return new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  self.addEventListener('fetch', (event) => {
    if (!event.request || event.request.method !== 'GET') return;

    let url;
    try {
      url = new URL(event.request.url);
    } catch {
      return;
    }

    // Only handle http/https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return;
    }

    // 1. Spatial & GeoJSON Interceptor (SWR)
    if (isSpatialRequest(url)) {
      event.respondWith(handleSpatialSWR(event.request));
      return;
    }

    // 2. Passthrough other non-spatial API calls, supabase, or cross-origin
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co') || url.origin !== self.location.origin) {
      return;
    }

    // 3. HTML Document (NetworkFirst)
    if (event.request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(event.request)
          .then((res) => {
            if (res && res.status === 200 && res.type !== 'opaque') {
              try {
                const copy = res.clone();
                caches.open(APP_CACHE_NAME).then((c) => c.put(event.request, copy).catch(() => {})).catch(() => {});
              } catch (e) {}
            }
            return res;
          })
          .catch(() => caches.match(event.request).then((cached) => cached || fetch(event.request)))
      );
      return;
    }

    // 4. Static assets (CacheFirst / SWR)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached && url.pathname.startsWith('/assets/')) {
          return cached;
        }
        const fetchPromise = fetch(event.request).then((netRes) => {
          if (netRes && netRes.status === 200 && netRes.type !== 'opaque') {
            try {
              const copy = netRes.clone();
              caches.open(APP_CACHE_NAME).then((c) => c.put(event.request, copy).catch(() => {})).catch(() => {});
            } catch (e) {}
          }
          return netRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  });
}
}
