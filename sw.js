const VERSION = 'v1';
const ASSET_CACHE = `assets-${VERSION}`;
const TILE_CACHE  = `tiles-${VERSION}`;

const CORE_ASSETS = [
  '/assets/1945-clevelandfilm.html',
  '/assets/sw.js'
];

const ALLOWED_TILE_HOSTS = [
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    try { await cache.addAll(CORE_ASSETS); } catch (e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(k => (k.startsWith('assets-') || k.startsWith('tiles-')) && k !== ASSET_CACHE && k !== TILE_CACHE
        ? caches.delete(k)
        : Promise.resolve()
      )
    );
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  if (ALLOWED_TILE_HOSTS.includes(url.host)) {
    event.respondWith(staleWhileRevalidateWithLimit(req, TILE_CACHE, 1500));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    if (request.destination === 'document') {
      const shell = await cache.match('/assets/1945-clevelandfilm.html');
      if (shell) return shell;
    }
    throw e;
  }
}

async function staleWhileRevalidateWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((resp) => {
    if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
      cache.put(request, resp.clone());
      trimCache(cache, maxEntries).catch(() => {});
    }
    return resp;
  }).catch(() => cached);

  return cached || networkFetch;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.length - maxEntries;
  for (let i = 0; i < toDelete; i++) {
    await cache.delete(keys[i]);
  }
}
