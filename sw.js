const CACHE_NAME = 'jingyu-today-cache-v4'; // Bump version to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/index.tsx'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (e.g., loading the page), try network first
  // to get the latest version, then fall back to cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For all other requests (assets, etc.), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then(response => {
      // If the request is in the cache, return it.
      // Otherwise, fetch it from the network.
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