// service-worker.js
// Cache pour usage hors-ligne (PWA) - stratégie "network-first"
//
// IMPORTANT : la version précédente utilisait une stratégie "cache-first"
// (caches.match(...) || fetch(...)), ce qui veut dire qu'une fois l'app
// installée sur un téléphone, elle continuait à servir indéfiniment
// l'ancienne version, même après une mise à jour publiée sur GitHub.
// On passe donc en "network-first" : si le réseau répond, on l'utilise
// (et on met à jour le cache au passage) ; sinon, on retombe sur le cache
// (mode hors-ligne).

const CACHE_NAME = 'pancake-timer-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './translations.js',
  './recipes.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => cachedResponse || caches.match('./index.html'))
      )
  );
});
