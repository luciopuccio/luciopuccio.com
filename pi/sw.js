/*
  Pi Arcade offline helper (service worker), scope /pi/.
  - On install it saves the game, the site bar, the icons and the arcade fonts.
  - Game files: served from the saved copy straight away (works with no signal),
    while a fresh copy is fetched in the background for next time.
  - Fonts: served from the saved copy; fetched once if missing.
  Bump VERSION to force every phone to drop its old copy.
*/
const VERSION = 'pi-arcade-v1';
const CORE = [
  '/pi/',
  '/nav.js',
  '/favicon.svg',
  '/pi/manifest.webmanifest',
  '/pi/icons/icon-192.png',
  '/pi/icons/icon-512.png',
  '/pi/icons/apple-touch-icon.png',
];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';

async function cacheFonts(cache) {
  // Best effort: the game still works with fallback fonts if this fails.
  try {
    const res = await fetch(FONT_CSS, { mode: 'cors' });
    if (!res.ok) return;
    await cache.put(FONT_CSS, res.clone());
    const css = await res.text();
    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1]);
    await Promise.all(urls.map(async (u) => {
      try { const f = await fetch(u, { mode: 'cors' }); if (f.ok) await cache.put(u, f); } catch (e) {}
    }));
  } catch (e) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await cacheFonts(cache);
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
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isOurs = url.origin === self.location.origin &&
    (url.pathname.startsWith('/pi/') || url.pathname === '/pi' || url.pathname === '/nav.js' || url.pathname === '/favicon.svg');
  if (!isFont && !isOurs) return; // everything else: normal network

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    // The game page answers to /pi, /pi/, /pi/index.html and /pi/?anything
    const key = isOurs && req.mode === 'navigate' ? '/pi/' : req;
    const cached = await cache.match(key, { ignoreSearch: isOurs });

    if (isFont) {
      if (cached) return cached;
      try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }
      catch (e) { return new Response('', { status: 504 }); }
    }

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
