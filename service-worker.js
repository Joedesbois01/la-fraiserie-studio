const CACHE_NAME = 'la-fraiserie-studio-v4';
const APP_SHELL = [
  './', './index.html', './app.js', './send-test.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './photos/berry-principal.jpg', './photos/berry-led.jpg',
  './photos/berry-detail.jpg', './photos/berry-angle.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function appIndex(request) {
  const response = await fetch(request);
  if (!response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  if (html.includes('src="./app.js"') || html.includes('src="app.js"')) {
    const injected = html.includes('src="./send-test.js"') || html.includes('src="send-test.js"')
      ? html
      : html.replace('</body>', '<script src="./send-test.js"></script></body>');
    return new Response(injected, {status: response.status, statusText: response.statusText, headers: new Headers(response.headers)});
  }
  const injected = html.replace('</body>', '<script src="./app.js"></script><script src="./send-test.js"></script></body>');
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(injected, {status: response.status, statusText: response.statusText, headers});
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(appIndex(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && response.type !== 'opaque') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
