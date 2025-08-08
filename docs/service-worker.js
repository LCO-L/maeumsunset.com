self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('sunset-v6').then(cache=>cache.addAll([
    './', './index.html', './styles.css', './app.js', './manifest.json', './campfire_growth_config.json',
    './probe_bank.json', './assets/fire_levels_spritesheet.png', './assets/icon-192.png', './assets/icon-512.png'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(resp=> resp || fetch(e.request)));
});