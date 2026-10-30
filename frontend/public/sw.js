// Offline support is deliberately limited to a connection-help screen and its
// branding. Account pages, orders, API responses and Next.js payloads stay online.
const CACHE_NAME = "viraasat-37ecc9b0aca7";
const PRECACHE_ASSETS = ['/offline.html', '/offline-retry.js', '/icons/viraasat-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => (key.startsWith('viraasat-') && key !== CACHE_NAME) || key === 'undefined').map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== 'GET') return;
  // Never cache private HTML, React Server Component responses, APIs, or bundles.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || new Response('You are offline. Reconnect and reload Viraasat.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
    return;
  }
  if (PRECACHE_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
