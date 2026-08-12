const CACHE = 'mv-calidad-v2';
const SHELL = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// index.html (y cualquier navegación): siempre busca la versión más nueva en la red primero.
// Solo usa la copia guardada si no hay conexión a internet.
// Los archivos estáticos (íconos, manifest): cache primero, más rápido y no cambian seguido.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/');

  if (isHTML) {
    e.respondWith(
      fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  if (SHELL.some(s => url.pathname.endsWith(s.replace('./', '')))) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
