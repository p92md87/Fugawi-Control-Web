const CACHE = "fugawi-control-v010";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=010",
  "./q47.css?v=010",
  "./raw.css?v=010",
  "./app.js?v=010",
  "./q47.js?v=010",
  "./raw.js?v=010",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("fugawi-control-") && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url=new URL(event.request.url);
  const isAppAsset=
    url.origin===self.location.origin &&
    (
      event.request.mode==="navigate" ||
      /\.(?:js|css|html|webmanifest)$/.test(url.pathname)
    );

  if (isAppAsset) {
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response => {
          const copy=response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request,copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
