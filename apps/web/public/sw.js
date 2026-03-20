/**
 * OPYNX Service Worker
 *
 * Strategies:
 * - Cache-first for static assets (JS, CSS, images, fonts)
 * - Stale-while-revalidate for API calls
 * - Background sync for offline scan queue
 */

const CACHE_NAME = 'opynx-v1';
const STATIC_CACHE = 'opynx-static-v1';
const API_CACHE = 'opynx-api-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
];

// ─── Install: Pre-cache critical assets ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: Clean up old caches ───
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !allowedCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: Route requests to appropriate strategy ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, etc.)
  if (request.method !== 'GET') return;

  // API calls: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation and other requests: network-first with offline fallback
  event.respondWith(networkFirst(request));
});

// ─── Cache-First Strategy ───
// Best for static assets that rarely change (versioned JS/CSS bundles, images)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ─── Stale-While-Revalidate Strategy ───
// Best for API responses: serve cached version immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed — cached response (if any) is already being returned
      return null;
    });

  // Return cached immediately, or wait for network
  return cachedResponse || (await fetchPromise) || new Response('Offline', { status: 503 });
}

// ─── Network-First Strategy ───
// Best for HTML pages: try network, fall back to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Offline fallback page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}

// ─── Helpers ───

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|mp3|wav)$/i.test(
    pathname
  );
}

// ─── Background Sync: Offline Scan Queue ───
// Registers a sync event so that queued QR scans are submitted when back online.

self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-scan-queue') {
    event.waitUntil(processOfflineScanQueue());
  }
});

async function processOfflineScanQueue() {
  try {
    // Read queued scans from IndexedDB
    const db = await openScanDB();
    const tx = db.transaction('scans', 'readonly');
    const store = tx.objectStore('scans');
    const scans = await getAllFromStore(store);
    await tx.done;

    // Submit each queued scan
    for (const scan of scans) {
      try {
        const response = await fetch('/api/scans/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scan.data),
        });

        if (response.ok) {
          // Remove successfully submitted scan from queue
          const deleteTx = db.transaction('scans', 'readwrite');
          const deleteStore = deleteTx.objectStore('scans');
          deleteStore.delete(scan.id);
          await deleteTx.done;
        }
      } catch {
        // Will retry on next sync event
        console.warn('[SW] Failed to sync scan, will retry:', scan.id);
      }
    }

    db.close();
  } catch (error) {
    console.error('[SW] Error processing offline scan queue:', error);
  }
}

function openScanDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('opynx-scans', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('scans')) {
        db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Register for Background Sync ───
// Client-side code should call:
//   navigator.serviceWorker.ready.then(reg => reg.sync.register('offline-scan-queue'));

// ─── Message Handler ───
// Allows the app to communicate with the service worker
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(urls));
  }
});
