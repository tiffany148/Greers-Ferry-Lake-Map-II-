/* Greers Ferry Lake Explorer — service worker
   Caches the app shell. Map tiles are cached opportunistically as they are viewed. */
const CACHE = "gfl-explorer-v32";
const SHELL = [
  "./", "./index.html", "./share.html", "./coves.js", "./hist-prelake-valley.jpg",
  "./manifest.json", "./manifest-share.json",
  "./icon.svg", "./icon-192.png", "./icon-512.png", "./maskable-512.png",
  "./apple-touch-icon.png", "./apple-touch-icon-lake.png", "./favicon-32.png", "./favicon.ico"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match("./index.html")))
    );
    return;
  }
  // Live lake-level / temperature feeds: always network (never serve a stale cached reading).
  if (url.hostname === "cwms-data.usace.army.mil" || url.hostname === "waterservices.usgs.gov") {
    e.respondWith(fetch(req));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
