const CACHE_NAME = 'yuanqi-workbench-v34';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

// Helper: fetch with timeout (in ms)
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Fetch timeout'));
    }, timeoutMs);
    fetch(request).then((response) => {
      clearTimeout(timer);
      resolve(response);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

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

  // Network-first for manifest, icons, and sw.js
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

  // For navigation requests: network-first WITH 5-second timeout
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(event.request, 5000).then((fetchResponse) => {
        const clone = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return fetchResponse;
      }).catch(() => {
        return caches.match('./index.html').then((cached) => {
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>离线</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#faf8f5;color:#5a4a4a;text-align:center;padding:20px}</style></head><body><div><h2>当前处于离线状态</h2><p>请检查网络连接后重新打开 APP</p><button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:#e8a0a0;color:#fff;font-size:16px;margin-top:20px">重试</button></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // For other requests, cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
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
