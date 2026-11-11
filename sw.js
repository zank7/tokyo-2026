// 離線快取：第一次開啟後，沒有網路也能打開 App
const CACHE = 'tokyo2026-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
const KEEP = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.tailwindcss.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url), own = url.origin === location.origin;
  if (!own && !KEEP.includes(url.hostname)) return;            // 地圖、匯率等照常走網路
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: own});
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (own && req.mode === 'navigate') return (await net) || hit || c.match('index.html');   // 頁面：有網路拿新版，沒網路用快取
    return hit || (await net) || Response.error();
  }));
});
