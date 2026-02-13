/**
 * LexBANK Service Worker
 * Provides offline caching and background sync for the chat PWA
 */

const CACHE_NAME = 'lexbank-chat-v1';
const STATIC_ASSETS = [
  '/chat',
  '/chat/index.html',
  '/chat/app.js',
  '/chat/styles.css',
  '/chat/manifest.json',
  '/chat/key-status-display.js'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/vue@3/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Partial caching is acceptable - CDN assets cached on first use
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
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

// Fetch - network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-only (don't cache chat responses)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({
            error: 'offline',
            output: 'أنت غير متصل بالإنترنت. يرجى المحاولة عند عودة الاتصال.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )
    );
    return;
  }

  // CDN assets: cache-first with network fallback
  if (!url.origin.includes(self.location.origin)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets: cache-first, update in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
