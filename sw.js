// SpendLens service worker — browser/PWA build only.
//
// Cache-first for same-origin GETs, falling back to the network and caching
// the response for next time. No precompiled asset manifest (that needs a
// build-time plugin we haven't added — see the fullstack report); this
// grows the cache organically as the owner uses the app, which is enough to
// make an already-visited install work offline and to survive a reload.
// Never touches cross-origin requests — local-first, no third-party calls.

const CACHE_NAME = "spendlens-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
