const CACHE_NAME = 'cafe-order-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-256x256.svg',
  '/icon-384x384.svg',
  '/icon-512x512.svg',
  '/screenshot-mobile.svg',
  '/screenshot-desktop.svg',
  '/menu-images/coffee.svg',
  '/menu-images/food.svg',
  '/menu-images/drink.svg',
  '/menu-images/dessert.svg',
  '/menu-images/snack.svg'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      }
    )
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})