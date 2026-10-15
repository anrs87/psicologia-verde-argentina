const CACHE_NAME = 'psicologia-verde-shell-v1';
const AUDIO_CACHE = 'psicologia-verde-offline-v1';

const SHELL_ASSETS = [
  '/portal/',
  '/portal/index.html',
  '/portal/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => console.log('SW install cache notice:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  const url = new URL(event.request.url);

  // Audio offline cache check
  if (url.pathname.endsWith('.mp3') || url.pathname.includes('/audios/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
    );
    return;
  }

  // App shell / assets: Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/portal/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
