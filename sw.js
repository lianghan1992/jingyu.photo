const CACHE_NAME = 'jingyu-today-cache-v4'; // Bump version to force update
const urlsToCache = [
  '/index.html',
  '/manifest.json'
];

// --- IndexedDB Helpers for Auth Token ---
const DB_NAME = 'jingyu-today-db';
const DB_VERSION = 1;
const STORE_NAME = 'auth';
const TOKEN_KEY = 'authToken';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    // The app will handle onupgradeneeded
  });
}

function getTokenFromDb(db) {
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // If the store doesn't exist, it means the user hasn't logged in yet.
        resolve(null);
        return;
      }
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(TOKEN_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    } catch (error) {
      reject(error);
    }
  });
}

async function getAuthToken() {
    let db;
    try {
        db = await openDb();
        const token = await getTokenFromDb(db);
        return token;
    } catch (error) {
        console.error('SW: Failed to get token from IndexedDB', error);
        return null;
    } finally {
        if (db) db.close();
    }
}

async function fetchWithAuth(request) {
    const token = await getAuthToken();

    if (!token) {
        console.warn('SW: No auth token found for API request. Allowing request to proceed without auth.');
        // Let the original request go through; it will likely fail with 401 and trigger a reload via api.ts.
        return fetch(request);
    }

    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // Create a new request with the updated headers.
    const authRequest = new Request(request, { headers });

    return fetch(authRequest);
}


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only handle GET requests in the SW.
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);

  // --- 1. Handle API requests for media with auth ---
  // This is crucial for streaming video via <video src="...">
  if (url.pathname.startsWith('/api/media/')) {
    event.respondWith(fetchWithAuth(event.request));
    return; // Request is handled
  }

  // --- 2. For navigation requests, serve the app shell from cache ---
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return; // Request is handled
  }

  // --- 3. For all other assets, use a cache-first strategy ---
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});