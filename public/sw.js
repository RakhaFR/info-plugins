const CACHE_NAME = 'theotownhub-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jangan intercept manifest, sw, atau Next.js internal
  if (
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/_next/webpack')
  ) {
    return;
  }

  // Semua request lain: network-first, fallback ke cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache hanya response valid
        if (response && response.status === 200 && request.url.startsWith('http')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
