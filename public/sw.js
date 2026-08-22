/* Aria's Color Garden — Progressive Web App service worker
 * Caches the game shell, assets, icons, and optional voice recordings.
 * Never caches node_modules, .env, API keys, or Python environments.
 * localStorage collection progress is untouched by updates.
 */

const CACHE_VERSION = "aria-garden-pwa-v5";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-180.png",
];

const NEVER_CACHE = [
  /\/node_modules\//i,
  /\/\.env/i,
  /\/\.git/i,
  /\/\.wrangler\//i,
  /\/python/i,
  /\/venv\//i,
  /\.py$/i,
  /api[_-]?key/i,
  /\/model\//i,
  /chrome-extension:/i,
];

function shouldNeverCache(url) {
  const href = typeof url === "string" ? url : url.href;
  return NEVER_CACHE.some((re) => re.test(href));
}

function isVoiceOrAudio(url) {
  return /\/audio\//i.test(url.pathname) || /\.(mp3|wav|ogg|m4a)$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return (
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|webmanifest)$/i.test(url.pathname) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/art/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.includes("/.vite/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE_URLS);
      // Do not skipWaiting here — first install / updates are controlled by the page
      // so parents can confirm updates without wiping Aria's collection (localStorage).
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("aria-garden-pwa-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (shouldNeverCache(url)) return;

  // HTML navigations: network first, cache fallback, then offline page
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Voice + static assets: cache-first, then network
  if (isVoiceOrAudio(url) || isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Everything else same-origin: stale-while-revalidate style
  event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
});

async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, fresh.clone());
      // Also keep a copy of "/" for offline cold start
      if (new URL(request.url).pathname === "/") {
        cache.put("/", fresh.clone());
      }
    }
    return fresh;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached =
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      (await caches.match(request)) ||
      (await caches.match("/"));
    if (cached) return cached;
    return (
      (await caches.match("/offline.html")) ||
      new Response("The garden is offline. Please connect once to download it.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && !shouldNeverCache(request.url)) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    if (isVoiceOrAudio(new URL(request.url))) {
      // Missing uncached recording — quiet empty audio-ish failure for UI to ignore
      return new Response("", { status: 503, statusText: "Offline audio unavailable" });
    }
    return (
      (await caches.match("/offline.html")) ||
      new Response("This garden piece isn’t saved offline yet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok && !shouldNeverCache(request.url)) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;
  return (
    (await caches.match("/offline.html")) ||
    new Response("This garden piece isn’t saved offline yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}
