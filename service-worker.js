const CACHE_NAME = 'yul-apps-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './gecko.png',
  './coin.png',
  './bike.png'
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
      .then(response => response || fetch(event.request))
  );
});
