let cacheName = "sourceCache";
let resorces = ["", "script.js", "style.css", "favicon.ico"];
let pathname = new URL(self.registration.scope).pathname;
resorces = resorces.map((s) => pathname + s);

async function precache() {
  let cache = await caches.open(cacheName);
  return cache.addAll(resorces);
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache());
});

async function cacheRefresh(req) {
  let refresh = fetch(req).then(async (rsp) => {
    if (rsp.ok) {
      let cache = await caches.open(cacheName);
      cache.put(req, rsp.clone());
    }
    return rsp;
  });
  return (pathname != "/" ? await caches.match(req) : null) || (await refresh);
}

self.addEventListener("fetch", (e) => {
  if (resorces.includes(new URL(e.request.url).pathname))
    e.respondWith(cacheRefresh(e.request));
});
