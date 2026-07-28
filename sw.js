const CACHE_NAME = 'yuanqi-workbench-v10';
const ASSETS = [
  './workspace_optimized.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for manifest, icons, and sw.js — ensures updates are always loaded
  if (url.pathname.endsWith('/manifest.json') ||
      url.pathname.endsWith('/icon-192.png') ||
      url.pathname.endsWith('/icon-512.png') ||
      url.pathname.endsWith('/apple-touch-icon.png') ||
      url.pathname.endsWith('/icon-192-maskable.png') ||
      url.pathname.endsWith('/icon-512-maskable.png') ||
      url.pathname.endsWith('/sw.js')) {
    event.respondWith(
      fetch(event.request).then((fetchResponse) => {
        const clone = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return fetchResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // For navigation requests, network-first — always get latest HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((fetchResponse) => {
        const clone = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return fetchResponse;
      }).catch(() => {
        // Fallback to cached main page when offline
        return caches.match('./workspace_optimized.html');
      })
    );
    return;
  }

  // For other requests, cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache CDN scripts for offline use
        if (fetchResponse.ok && (
          event.request.url.includes('cdn.sheetjs.com') ||
          event.request.url.includes('cdnjs.cloudflare.com')
        )) {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return fetchResponse;
      }).catch(() => {
        return caches.match(event.request);
      });
    })
  );
});
