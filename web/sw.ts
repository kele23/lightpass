/// <reference lib="webworker" />

// Per TypeScript serve questo casting per far capire che "self"
// si riferisce a un Service Worker e non alla pagina normale.
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'lightpass-v1';

// 1. Installazione
sw.addEventListener('install', (event: ExtendableEvent) => {
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
sw.addEventListener('activate', (event: ExtendableEvent) => {
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
sw.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Ignoriamo le richieste verso le API esterne, CouchDB e qualsiasi chiamata che non sia una GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/couch/')) {
    return; // Non fa nulla, lascia che il browser gestisca la richiesta normalmente
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Se c'è il file in cache, passiamo quello!
        return cachedResponse;
      }

      // Altrimenti lo scarica da internet
      return fetch(event.request)
        .then((networkResponse) => {
          // Salviamo dinamicamente in cache tutto ciò che scarichiamo con successo (Vite modules, immagini, ecc)
          // tranne se è un errore o una risposta opaca non valida
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async (error) => {
          // Se fetch() va in eccezione (siamo offline e la risorsa non è in cache!)
          // Se l'utente sta navigando verso una rotta SPA (es: /login, /race/1),
          // il browser chiederà il file HTML. Ritorniamo '/index.html' precaricato!
          if (event.request.mode === 'navigate') {
            const indexHtml = await caches.match('/index.html');
            if (indexHtml) return indexHtml;
          }
          throw error;
        });
    }),
  );
});
