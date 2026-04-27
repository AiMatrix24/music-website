/**
 * OPYNX Service Worker
 *
 * Strategies:
 * - Cache-first for static assets (JS, CSS, images, fonts)
 * - Stale-while-revalidate for API calls
 * - Background sync for offline scan queue
 */

// Bumped from v1 → v2 to force iOS clients to invalidate the old SW that was
// caching media (.mp3/.wav) without proper Range request support, which broke
// HTML5 audio playback on iOS Safari. Old caches are deleted in the activate
// handler when names don't match `allowedCaches`.
const CACHE_NAME = 'opynx-v10';
const STATIC_CACHE = 'opynx-static-v9';
const API_CACHE = 'opynx-api-v9';

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

  // ── DO NOT intercept cross-origin requests ──
  // The browser handles these natively with proper Range request support, which
  // is required for HTML5 audio/video on iOS Safari. Caching cross-origin
  // media via the SW returns opaque responses that iOS refuses to play.
  if (url.origin !== self.location.origin) return;

  // ── DO NOT intercept media requests, even same-origin ──
  // Audio/video need partial-content (Range) responses to seek/buffer.
  // Cached responses break this on iOS.
  if (isMediaRequest(request, url.pathname)) return;

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

function isMediaRequest(request, pathname) {
  // Match by Accept header (browser explicitly asks for media)
  const accept = request.headers.get('accept') || '';
  if (accept.startsWith('audio/') || accept.startsWith('video/')) return true;
  // Match by Range header (typical for media seeking/buffering)
  if (request.headers.has('range')) return true;
  // Match by file extension
  if (/\.(mp3|wav|m4a|mp4|ogg|webm|flac|aac)$/i.test(pathname)) return true;
  return false;
}

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
  // Audio/video deliberately excluded — handled by isMediaRequest() above
  // and passed straight to the browser for proper Range request support.
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i.test(
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

// ─── Web Push ───
// Server posts JSON { title, body, link, type } to our VAPID endpoint;
// we render a notification and route the click back into the app.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'OPYNX', body: event.data.text() };
  }

  const title = payload.title || 'OPYNX';
  const options = {
    body: payload.body || '',
    // Reuse the PWA icon — same OPYNX logo on dark bg.
    icon: '/icon-192.png',
    // 96×96 monochrome on Android; we use the same icon — close enough.
    badge: '/icon-192.png',
    // Stash the link so notificationclick can route to it.
    data: { link: payload.link || '/notifications', type: payload.type },
    // Renotify=true so multiple notifications of the same type don't merge silently.
    renotify: false,
    // Tag groups duplicate notifications so a user mid-flood sees the latest, not 50.
    tag: payload.type || 'opynx',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/notifications';

  // Focus an existing tab if one's already open on the same origin;
  // otherwise open a fresh one. This is the standard "open or focus" pattern.
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          // Prefer focusing an existing tab and navigating it to the link.
          if ('focus' in client) {
            client.navigate(link).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
      })
  );
});
