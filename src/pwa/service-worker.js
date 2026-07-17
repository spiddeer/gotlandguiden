const STATIC_CACHE = "gutafinn-static-__BUILD_VERSION__"
const DATA_CACHE = "gutafinn-data-v1"
const PRECACHE_URLS = __PRECACHE_URLS__
const DATA_URLS = ["/api/places", "/api/categories", "/api/collections"]

async function warmDataCache() {
  const cache = await caches.open(DATA_CACHE)
  await Promise.all(DATA_URLS.map(async (url) => {
    try {
      const request = new Request(new URL(url, self.location.origin), {
        headers: { Accept: "application/json" },
      })
      const response = await fetch(request)
      if (response.ok) await cache.put(request, response)
    } catch {
      // Static installation remains valid when the API is temporarily unavailable.
    }
  }))
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
      warmDataCache(),
    ])
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("gutafinn-static-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

async function networkFirstData(request) {
  const cache = await caches.open(DATA_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
      return response
    }
    return (await cache.match(request)) || response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request)
  } catch {
    return (await caches.match("/index.html")) || Response.error()
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (DATA_URLS.includes(url.pathname)) {
    event.respondWith(networkFirstData(request))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
