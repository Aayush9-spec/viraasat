// PWA Service Worker for Viraasat
//
// The CACHE_NAME is rewritten at build time by `scripts/build-sw.js` to
// include a short hash of the build, so each deploy creates a new cache and
// `activate` evicts the old one. Combined with a `?v=<hash>` query string
// on the registration URL, this guarantees users pick up the new SW cleanly.

const CACHE_NAME = "viraasat-d674c84d";
/* CACHE_NAME_INJECTED */

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/viraasat-logo-full.png',
  '/viraasat-hero-cream.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use Promise.allSettled so an individual asset fetch failure does not
      // abort the entire Service Worker installation.
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: 'no-cache' });
            if (response && response.ok) {
              await cache.put(asset, response);
            }
          } catch (err) {
            console.warn('[SW] Precache skipped for ' + asset, err);
          }
        }),
      );
    }),
  );
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => (k.startsWith('viraasat-') && k !== CACHE_NAME) || k === 'undefined')
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin requests (e.g. Supabase, Clerk, CDNs, Analytics): bypass SW
  if (url.origin !== location.origin) return;
  if (request.url.startsWith('chrome-extension://')) return;

  // Cache API only supports GET requests. Non-GET requests (POST, PUT, DELETE, etc.) are left to the browser.
  if (request.method !== 'GET') return;

  // Dynamic API calls & auth: network only, never cache private or authenticated customer data
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth') ||
    url.searchParams.has('_rsc')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Next.js chunks, scripts, and Turbopack chunks: always network-only
  // Stale chunks across builds cause ChunkLoadError and hydration crashes.
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.endsWith('.hot-update.json') ||
    url.pathname.endsWith('.hot-update.js')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML navigations: network-first, fall back to cache, then /offline, then safe inline HTML response.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Attempt cached page
          const cached = await caches.match(request);
          if (cached) return cached;

          // Attempt cached offline page
          const offlinePage = await caches.match('/offline');
          if (offlinePage) return offlinePage;

          // Safe inline fallback so event.respondWith NEVER receives undefined or throws TypeError
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Offline - Viraasat</title><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#FAF7F2;color:#221C18;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px}h1{font-size:1.8rem;color:#701D24;margin-bottom:8px}p{color:#655B53;margin:12px 0 24px;font-size:1rem}button{background:#701D24;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(112,29,36,0.25)}</style></head><body><div><h1>You are offline</h1><p>Check your internet connection and try again.</p><button onclick="window.location.reload()">Retry</button></div></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            },
          );
        }),
    );
    return;
  }

  // Static assets (images, fonts, static css): stale-while-revalidate against current build cache
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
