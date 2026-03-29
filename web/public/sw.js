/// <reference lib="webworker" />

/**
 * @type {ServiceWorkerGlobalScope}
 */
const sw = self;

const CACHE_NAME = 'lightpass-v1';

// 1. Installazione
sw.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(['/', '/index.html', '/favicon.ico', '/manifest.webmanifest', '/rocket.svg']);
    }),
  );
  sw.skipWaiting();
});

// 2. Attivazione
sw.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  event.waitUntil(sw.clients.claim());
});

// 3. Fetch
sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignoriamo le chiamate verso le API esterne, CouchDB e quelle che non sono GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/couch/')) {
    return; // Non fa nulla, lascia che il browser gestisca la richiesta
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async (error) => {
          if (event.request.mode === 'navigate') {
            const indexHtml = await caches.match('/index.html');
            if (indexHtml) return indexHtml;
          }
          throw error;
        });
    }),
  );
});
