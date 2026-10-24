/* SurjoSangstha offline service worker */
const VERSION = "ss-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const IMG_CACHE = `${VERSION}-img`;
const PRECACHE = ["/", "/products", "/offline", "/logo.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGE_CACHE).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations: network first, fall back to cached page, then offline page
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { if (res.ok && !res.redirected) caches.open(PAGE_CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(async () => (await caches.match(req)) || (await caches.match(url.pathname)) || (await caches.match("/offline")) || Response.error()),
    );
    return;
  }
  // Next static assets: cache first
  if (url.origin === location.origin && url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { caches.open(STATIC_CACHE).then((c) => c.put(req, res.clone())); return res; })));
    return;
  }
  // Catalog / bootstrap / notification data: network first with cache fallback
  if (url.origin === location.origin && (url.pathname.startsWith("/api/store/") || url.pathname.startsWith("/api/employee/"))) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) caches.open(DATA_CACHE).then((c) => c.put(req, res.clone())); return res; }).catch(() => caches.match(req).then((hit) => hit || Response.error())));
    return;
  }
  // Images (local uploads, /images, pexels): stale while revalidate
  if (req.destination === "image" || url.pathname.startsWith("/api/files/") || url.hostname.includes("pexels")) {
    e.respondWith(
      caches.open(IMG_CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }
  // Fonts / others: stale while revalidate
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.open(STATIC_CACHE).then(async (c) => { const hit = await c.match(req); const net = fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit); return hit || net; }));
  }
});

/* ---------------- Web Push ---------------- */
self.addEventListener("push", (event) => {
  let data = { title: "SurjoSangstha", body: "নতুন নোটিফিকেশন", link: "/", tag: "ss" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (e) { /* ignore */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      tag: data.tag || "ss",
      data: { link: data.link || "/" },
      vibrate: [120, 60, 120],
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) { client.navigate(link); return client.focus(); }
      }
      return self.clients.openWindow(link);
    }),
  );
});
