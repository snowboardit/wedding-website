async function networkFirst(request) {
  try {
    console.log("Fetching from network:", request.url);
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      console.log("Network response OK:", request.url);
      const cache = await caches.open("MyCache_1");
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Network request failed, trying cache:", request.url, error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("Found cached response:", request.url);
    } else {
      console.error("No cached response found:", request.url);
    }
    return cachedResponse || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  console.log("Fetch event for:", url.pathname);
  event.respondWith(networkFirst(event.request));
});
