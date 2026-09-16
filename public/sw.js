/* Focusly service worker — offline-first shell.
 * Strategy:
 *  - navigations (HTML): network-first, fallback to cached "/" then /offline.html
 *  - static brand assets (icons, manifest, fonts): cache-first
 *  - framework bundles (/_next/*) and everything else: network-first with cache fallback
 *  - /api/* and non-GET: never cached, straight to network
 */
const VERSION = "focusly-v3";
const SHELL_CACHE = VERSION + "-shell";
const RUNTIME_CACHE = VERSION + "-runtime";
const IMMUTABLE_CACHE = VERSION + "-immutable";

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isImmutable(url) {
  // Only truly static, versioned-by-filename assets. Framework chunks
  // (/_next/*) are served network-first so dev updates always come through.
  return (
    /^\/icon-\d+\.png$/.test(url.pathname) ||
    url.pathname === "/og-image.png" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName, fallbackUrl, noCache) {
  const cache = await caches.open(cacheName);
  try {
    // no-cache: revalidate with the server so bundle updates always land
    const res = await fetch(request, noCache ? { cache: "no-cache" } : undefined);
    if (res && res.ok && request.method === "GET") {
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (fallbackUrl) {
      const shell = await caches.open(SHELL_CACHE);
      const fallback =
        (await shell.match(fallbackUrl)) || (await shell.match("/"));
      if (fallback) return fallback;
    }
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch the API, the dev HMR endpoints or websocket upgrades
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, "/offline.html", true));
    return;
  }
  if (isImmutable(url)) {
    event.respondWith(cacheFirst(request, IMMUTABLE_CACHE));
    return;
  }
  // Framework bundles, page data and everything else: network-first with a
  // cached fallback so the app still boots offline once visited.
  const revalidate = url.pathname.startsWith("/_next/");
  event.respondWith(networkFirst(request, RUNTIME_CACHE, undefined, revalidate));
});
