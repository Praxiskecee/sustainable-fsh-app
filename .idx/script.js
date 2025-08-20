self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('pwa-cache-v1').then(cache => {
        return cache.addAll([
          '/index.html',
          '/manifest.json',
          '/assets/icons/icon-192.png',
          '/assets/icons/icon-512.png'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  });
  
  // Registrasi Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(function (registration) {
        console.log("✅ Service Worker terdaftar:", registration);
      })
      .catch(function (error) {
        console.log("❌ Service Worker gagal:", error);
      });
  });
}
