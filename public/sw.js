// Selah.fm Service Worker — v1
// Caches shell assets for offline access and faster repeat visits.

const CACHE_NAME = 'selah-v1';
const SHELL_URLS = [
  '/',
  '/browse',
  '/blog',
  '/manifest.json',
  '/images/selah-nav-logo.png',
];

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls, external resources
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for shell pages
        if (response.ok && url.pathname === '/') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: return cached shell
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
