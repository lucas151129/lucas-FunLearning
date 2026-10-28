/* 天天游戲 service worker
   策略：
   - 導覽（HTML）：network-first，離線時回快取外殼
   - 同源靜態資源：cache-first + 背景更新（stale-while-revalidate）
   - 跨網域（Supabase / Google Fonts）：完全不攔截
   版本號改動時，舊快取會在 activate 清掉。 */

const VERSION = "v4";
const SHELL_CACHE = `fl-shell-${VERSION}`;
const RUNTIME_CACHE = `fl-runtime-${VERSION}`;

const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/i18n.js",
  "js/catalog.js",
  "js/store.js",
  "js/app.js",
  "js/supabase-config.js",
  "assets/mascot.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => null)
        )
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("fl-") && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put("index.html", fresh.clone());
    return fresh;
  } catch (err) {
    const cached = (await cache.match(request, { ignoreSearch: true })) || (await cache.match("index.html"));
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  if (cached) {
    network.catch(() => {});
    return cached;
  }
  const fresh = await network;
  if (fresh) return fresh;
  const shell = await caches.open(SHELL_CACHE);
  const fallback = await shell.match(request, { ignoreSearch: true });
  if (fallback) return fallback;
  return new Response("離線中，這個資源還沒下載過。", {
    status: 504,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  /* 遊戲 iframe 由瀏覽器直接載入。若在這裡用 respondWith 攔截，
     部分 Chromium 會把 iframe navigation 標成 ERR_ABORTED，而且會把
     遊戲 HTML 誤存成平台的 index.html。 */
  if (request.mode === "navigate" && request.destination === "iframe") return;

  /* HTML / JS / CSS 走 network-first：更新後第一次載入就拿到新版，
     離線時才退回快取。圖片、字型等才會用 stale-while-revalidate。 */
  const dest = request.destination;
  if (request.mode === "navigate" || dest === "script" || dest === "style" || dest === "manifest" || dest === "document") {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
