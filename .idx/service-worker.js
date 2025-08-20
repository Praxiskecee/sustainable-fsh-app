self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    event.waitUntil(
      caches.open('pwa-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/style.css',
          '/script.js',
          '/manifest.json'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  