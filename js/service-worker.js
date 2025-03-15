const CACHE_NAME = "wedding-cache-v1",
  urlsToCache = ["/", "/index.html", "/css/styles.css", "/js/script.js"];

self.addEventListener("install", (event) => {
  // cache the defined resources during the install step
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (error) {
          console.error(`Failed to cache ${url}:`, error);
        }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  // remove old caches during the activate step
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // claim clients immediately so that the new SW controls pages
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // respond with cached resources, falling back to network if needed
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
