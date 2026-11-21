// KNUST Mart service worker: shows phone notifications sent by the server (Web Push).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* plain text */ }
  const title = data.title || "KNUST Mart";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.link || "knust-mart",
    renotify: true,
    data: { link: data.link || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      if ("focus" in client) { await client.focus(); if ("navigate" in client) await client.navigate(link); return; }
    }
    await self.clients.openWindow(link);
  })());
});
