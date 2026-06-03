const CACHE = 'frigurso-v3'
const PRECACHE = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.json']

self.addEventListener('install', e => {
  // Cachear individualmente — si algo falla no rompe todo
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(PRECACHE.map(url => c.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  if (e.request.url.includes('supabase') || e.request.url.includes('open-meteo') || e.request.url.includes('nominatim')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(e.request, clone))
      return res
    }).catch(() => caches.match('/')))
  )
})
