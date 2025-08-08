self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('sunset-v1').then(c=>c.addAll([
    './','./index.html','./styles.css','./app.js'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/manifest.json') {
    e.respondWith(fetch(e.request).catch(()=>caches.match('/manifest.json')));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});