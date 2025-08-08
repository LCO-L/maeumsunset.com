
const CACHE = 'sunset-v7';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./campfire_growth_config.json',
  './probe_bank.json','./assets/fire_levels_spritesheet.png','./assets/icon-192.png','./assets/icon-512.png'
  // manifest.json intentionally not pre-cached
];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  // Always try network first for navigation/HTML to avoid stale pages and enable routing
  const isNav = req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html');
  if(isNav){
    e.respondWith((async ()=>{
      try{
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      }catch(_){
        const cache = await caches.open(CACHE);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Bypass caching for manifest.json so DevTools can always fetch fresh
  if(url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('manifest.json')){
    e.respondWith(fetch(req));
    return;
  }

  // Cache-first for static assets
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if(cached) return cached;
    const res = await fetch(req);
    if(res && res.ok) cache.put(req, res.clone());
    return res;
  })());
});
