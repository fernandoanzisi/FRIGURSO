const CACHE = 'frigurso-v2'
const PRECACHE = ['/', '/index.html', '/icon.svg', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Solo cachear misma origin, GET requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  // Para APIs de Supabase/meteo, siempre network-first
  if (e.request.url.includes('supabase') || e.request.url.includes('open-meteo') || e.request.url.includes('nominatim')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }
  // Para el resto: cache-first (app shell)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(e.request, clone))
      return res
    }))
  )
})
