/* Focusly service worker — v5 "dev-proof" strategy.
 *
 * WHY v5 EXISTS (audit 2026-09-17, r12-b):
 * v4 cached Turbopack DEV chunks (/_next/static/chunks/*) and the dev HTML
 * document in its runtime/shell caches. Turbopack chunk URLs change on every
 * source change, so any transient network failure made the SW fall back to a
 * stale HTML (old component tree → stale React useId values) mixed with a
 * fresh client bundle: hydration mismatch ("radix-_R_…" id diffs) and, worse,
 * broken chunk combos whose event handlers never attached — every button on
 * the page went dead.
 *
 * v5 rules (safe under a dev server AND under a static production build):
 *  - HTML navigations: network-first, ONLY fallback = /offline.html.
 *    The app shell "/" is NEVER served from cache (no more stale-tree HTML).
 *  - /_next/* bundles: NEVER cached, NEVER served from cache (passthrough).
 *    Serving one cached chunk from an older compile poisons the whole load.
 *  - Only truly immutable assets (icons, manifest, woff2 fonts) are cached.
 *  - Upgrade path: on install, if caches from a previous focusly version
 *    exist, the worker calls skipWaiting() IMMEDIATELY (poisoned pages cannot
 *    be trusted to click a "Recharger" toast) → activate deletes every legacy
 *    cache → clients.claim() → the page's existing controllerchange handler
 *    reloads once → clean state, no user action required.
 */
const VERSION = "focusly-v5";
const SHELL_CACHE = VERSION + "-shell";
const IMMUTABLE_CACHE = VERSION + "-immutable";

const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE);
      // Coming from focusly-v4 (or any older/foreign focusly-* cache)?
      // The page may be running a stale, poisoned shell — take over NOW
      // instead of waiting for a user who cannot click anything.
      const keys = await caches.keys();
      const hasLegacy = keys.some(
        (k) => k.startsWith("focusly-") && !k.startsWith(VERSION)
      );
      if (hasLegacy) await self.skipWaiting();
    })()
  );
});

// Handshake with the page: the update toast sends SKIP_WAITING on demand
// (kept for future v5→v6 updates where the app is healthy enough to ask).
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "SKIP_WAITING") self.skipWaiting();
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
  // Only static, content-stable brand assets. Framework chunks (/_next/*)
  // are NEVER cached in v5 — see the strategy note at the top.
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

/** Network-first with revalidation; the ONLY HTML fallback is offline.html —
 * never the cached app shell, which is how v4 served stale trees. */
async function networkFirst(request, cacheName, fallbackUrl, noCache) {
  const cache = await caches.open(cacheName);
  try {
    // no-cache: revalidate with the server so updates always land
    const res = await fetch(request, noCache ? { cache: "no-cache" } : undefined);
    if (res && res.ok && request.method === "GET") {
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    if (fallbackUrl) {
      const shell = await caches.open(SHELL_CACHE);
      const fallback = await shell.match(fallbackUrl);
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
  // EVERYTHING else — /_next/* bundles, page data, robots.txt, … — goes
  // straight to the network. Caching dev bundles is what poisoned v4.
});
