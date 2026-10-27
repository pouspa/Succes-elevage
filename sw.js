/* Service worker fiable pour GitHub Pages et l'utilisation hors connexion. */
const CACHE_NAME = 'mon-poulailler-vide-v8-distribution-reelle';
const BASE = new URL('./', self.location.href);
const APP_SHELL = [
  new URL('./', self.location.href).href,
  new URL('./index.html', self.location.href).href,
  new URL('./app.js', self.location.href).href,
  new URL('./manifest.webmanifest', self.location.href).href,
  new URL('./icon-192.png', self.location.href).href,
  new URL('./icon-512.png', self.location.href).href,
  new URL('./icons/icon-192.png', self.location.href).href,
  new URL('./icons/icon-512.png', self.location.href).href
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Une ressource facultative manquante ne doit pas bloquer toute l'installation.
    await Promise.all(APP_SHELL.map(async url => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response.ok) await cache.put(url, response);
      } catch (_) { /* conservée pour une prochaine tentative si le réseau est indisponible */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('mon-poulailler-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Les pages de navigation retombent toujours sur index.html déjà mis en cache.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new URL('./index.html', self.location.href).href, response.clone());
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match(new URL('./index.html', self.location.href).href)) || new Response('Ouvre une première fois Mon Élevage Avicole avec Internet pour préparer le mode hors connexion.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) {
      // Mise à jour en arrière-plan, sans bloquer la réponse hors connexion.
      if (self.navigator && self.navigator.onLine) {
        fetch(request).then(response => { if (response && response.ok) cache.put(request, response.clone()); }).catch(() => {});
      }
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      if (url.pathname.endsWith('/app.js') || url.pathname.endsWith('/')) {
        const fallback = await cache.match(new URL('./index.html', self.location.href).href);
        if (fallback) return fallback;
      }
      return new Response('Ressource indisponible hors connexion.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
