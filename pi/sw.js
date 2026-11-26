/*
  Pi Arcade offline helper (service worker), scope /pi/.
  - On install it saves the game, the site bar, the icons and the arcade fonts
    (all hosted on luciopuccio.com; the game makes no outside requests).
  - Files are served from the saved copy straight away (works with no signal),
    while a fresh copy is fetched in the background for next time.
  Bump VERSION to force every phone to drop its old copy.
*/
const VERSION = 'pi-arcade-v2';
const CORE = [
  '/pi/',
  '/nav.js',
  '/favicon.svg',
  '/pi/manifest.webmanifest',
  '/pi/icons/icon-192.png',
  '/pi/icons/icon-512.png',
  '/pi/icons/apple-touch-icon.png',
  '/pi/fonts/press-start-2p.woff2',
  '/pi/fonts/vt323.woff2',
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isOurs = url.origin === self.location.origin &&
    (url.pathname.startsWith('/pi/') || url.pathname === '/pi' || url.pathname === '/nav.js' || url.pathname === '/favicon.svg');
  if (!isOurs) return; // everything else: normal network

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    // The game page answers to /pi, /pi/, /pi/index.html and /pi/?anything
    const key = isOurs && req.mode === 'navigate' ? '/pi/' : req;
    const cached = await cache.match(key, { ignoreSearch: true });

    // Stale-while-revalidate for the game's own files
    const refresh = fetch(req).then((res) => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(refresh); return cached; }
    const fresh = await refresh;
    return fresh || new Response('Offline and not saved yet. Open Pi Arcade once with a connection.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  })());
});
