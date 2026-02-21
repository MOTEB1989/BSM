// CoreHub Nexus iOS App - Service Worker
const CACHE_NAME = 'corehub-nexus-v1';
const OFFLINE_URL = '/ios-app/index.html';

// IndexedDB config for offline message queue
const DB_NAME = 'corehub-nexus-offline';
const DB_STORE = 'pending-messages';

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingMessages(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteMessage(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function syncOfflineMessages() {
  console.log('[SW] Syncing offline messages...');
  const db = await openDB();
  const pending = await getPendingMessages(db);

  if (pending.length === 0) {
    console.log('[SW] No pending messages to sync');
    return;
  }

  console.log(`[SW] Found ${pending.length} pending message(s) to sync`);

  for (const item of pending) {
    const endpoint = item.mode === 'direct' ? '/api/chat/direct' : '/api/chat';
    const payload = {
      message: item.message,
      language: item.language,
      history: [],
      ...(item.mode !== 'direct' && { destination: item.mode })
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await deleteMessage(db, item.id);
      console.log(`[SW] Synced and removed pending message id=${item.id}`);
    } else {
      console.warn(`[SW] Server rejected message id=${item.id}: HTTP ${response.status}`);
      // Leave the message in the queue; the sync event will retry
      throw new Error(`Server error ${response.status} for message id=${item.id}`);
    }
  }

  console.log('[SW] Offline message sync complete');
}

// Files to cache for offline support
const CACHE_URLS = [
  '/ios-app/',
  '/ios-app/index.html',
  '/ios-app/app.js',
  '/ios-app/manifest.json',
  '/src/chat/icons/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/vue@3/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(CACHE_URLS.filter(url => !url.startsWith('https://')));
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // For API calls, use network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return offline message
            return new Response(
              JSON.stringify({
                error: 'You are offline',
                message: 'Please check your internet connection'
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }
  
  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // Silently fail background update
            });
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page
            if (request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

// Background sync for offline messages (if supported)
if (self.registration.sync) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
      event.waitUntil(syncOfflineMessages());
    }
  });
}

console.log('[SW] Service worker loaded');
