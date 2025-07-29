const CACHE_NAME = 'railtask-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/css/style.css',
  '/js/angular.js',
  '/js/jquery-2.1.1.min.js',
  '/js/angular-csp.css',
  '/font/roboto/Roboto-Regular.woff2',
  '/font/material-design-icons/Material-Design-Icons.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});