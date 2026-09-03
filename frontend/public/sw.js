// PWA Service Worker for Viraasat
//
// The CACHE_NAME is rewritten at build time by `scripts/build-sw.js` to
// include a short hash of the build, so each deploy creates a new cache and
// `activate` evicts the old one. Combined with a `?v=<hash>` query string
// on the registration URL, this guarantees users on a stale tab pick up
// the new SW within a minute (the periodic update() check) and stop
// serving HTML/JS bundles from a previous build.

const CACHE_NAME = "viraasat-cec1b3ac";

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/viraasat-logo-full.png',
  '/viraasat-hero-cream.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(self.CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  // Take over open clients immediately. The registration URL carries a
  // ?v= hash that changes per deploy, so this only runs when there is
  // actually a new build to install.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('viraasat-') && k !== self.CACHE_NAME)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (request.url.startsWith('chrome-extension://')) return;

  // API calls: network only, never cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML navigations: network-first, fall back to cache, then /offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(self.CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline')),
        ),
    );
    return;
  }

  // Static assets: stale-while-revalidate against the build's cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const clone = response.clone();
            caches.open(self.CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
