// Service Worker: GeoJSON & Spatial Cache Layer with SWR / TTL Strategy
// Powered by Workbox with robust Native SWR Fallback

const APP_CACHE_NAME = 'luwu-invest-v5';
const SPATIAL_CACHE_NAME = 'geojson-spatial-cache-v1';
const SPATIAL_MAX_ENTRIES = 30;
const SPATIAL_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 hari TTL

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

  // 1. GEOJSON & SPATIAL DATA SWR CACHE LAYER (Strictly per instruction)
  registerRoute(
    ({ url }) =>
      url.pathname.endsWith('.geojson') ||
      url.pathname.includes('/spatial/') ||
      url.pathname.startsWith('/api/spatial-layers') ||
      url.pathname.startsWith('/api/tiles/') ||
      url.pathname.includes('gis_') ||
      url.pathname.endsWith('.json') && url.pathname.includes('gis'),
    new StaleWhileRevalidate({
      cacheName: SPATIAL_CACHE_NAME,
      plugins: [
        new ExpirationPlugin({
          maxEntries: SPATIAL_MAX_ENTRIES, // Batas maksimum file layer yang disimpan
          maxAgeSeconds: SPATIAL_MAX_AGE_SECONDS, // TTL 7 hari sebelum revalidasi total
          purgeOnQuotaError: true // Hapus otomatis jika storage browser penuh
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200, 204]
        })
      ]
    })
  );

  // 2. Static Assets & Vite chunks (CacheFirst - strictly same-origin)
  registerRoute(
    ({ request, url }) =>
      url.origin === self.location.origin && (
        url.pathname.startsWith('/assets/') ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.destination === 'image'
      ),
    new CacheFirst({
      cacheName: 'static-assets-cache-v1',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 3. Document / App Shell (NetworkFirst)
  registerRoute(
    ({ request }) => request.mode === 'navigate' || request.destination === 'document',
    new NetworkFirst({
      cacheName: 'app-shell-cache-v1',
      networkTimeoutSeconds: 3
    })
  );

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
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
            if (key !== APP_CACHE_NAME && key !== SPATIAL_CACHE_NAME && key !== 'static-assets-cache-v1') {
              return caches.delete(key);
            }
          })
        )
      )
    );
    self.clients.claim();
  });

  function isSpatialRequest(url) {
    return (
      url.pathname.endsWith('.geojson') ||
      url.pathname.includes('/spatial/') ||
      url.pathname.startsWith('/api/spatial-layers') ||
      url.pathname.startsWith('/api/tiles/') ||
      url.pathname.includes('gis_') ||
      (url.pathname.endsWith('.json') && url.pathname.includes('gis'))
    );
  }

  // Metadata cache for native TTL tracking
  const spatialMetaMap = new Map();

  async function handleSpatialSWR(request) {
    const cache = await caches.open(SPATIAL_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    const urlKey = request.url;
    const now = Date.now();

    // Background fetch & update
    const networkFetchPromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 204)) {
          const cloned = networkResponse.clone();
          await cache.put(request, cloned);
          spatialMetaMap.set(urlKey, now);

          // Enforce maxEntries: 30
          const keys = await cache.keys();
          if (keys.length > SPATIAL_MAX_ENTRIES) {
            const oldestKey = keys[0];
            await cache.delete(oldestKey);
            spatialMetaMap.delete(oldestKey.url);
          }
        }
        return networkResponse;
      })
      .catch((err) => {
        console.warn('[SW Native SWR] Background fetch error:', err?.message || err);
        return cachedResponse;
      });

    // Check if cached version is within TTL (7 days)
    if (cachedResponse) {
      const cachedTime = spatialMetaMap.get(urlKey) || now;
      const isExpired = (now - cachedTime) > (SPATIAL_MAX_AGE_SECONDS * 1000);

      if (!isExpired) {
        // Return stale response immediately, background revalidation running asynchronously
        return cachedResponse;
      }
    }

    // If no cache or expired, wait for network (fallback to cache on error)
    return networkFetchPromise.then((res) => {
      if (res) return res;
      if (cachedResponse) return cachedResponse;
      return new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });
  }

  self.addEventListener('fetch', (event) => {
    if (!event.request || event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 1. Spatial & GeoJSON Interceptor (SWR)
    if (isSpatialRequest(url)) {
      event.respondWith(handleSpatialSWR(event.request));
      return;
    }

    // 2. Passthrough other non-spatial API calls
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
      return;
    }

    // 3. HTML Document (NetworkFirst)
    if (event.request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(APP_CACHE_NAME).then((c) => c.put(event.request, copy));
            return res;
          })
          .catch(() => caches.match(event.request))
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
          if (netRes && netRes.status === 200) {
            const copy = netRes.clone();
            caches.open(APP_CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return netRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  });
}
