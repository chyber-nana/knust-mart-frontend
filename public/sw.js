/* KNUST Mart service worker — handles phone push notifications. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "KNUST Mart", body: "You have a new update.", link: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    /* keep defaults */
  }
  const title = data.title || "KNUST Mart";
  const options = {
    body: data.body || "",
    icon: "https://vkhgvaencdidocddyorp.supabase.co/storage/v1/object/public/knust-mart/logo.jpg",
    badge: "https://vkhgvaencdidocddyorp.supabase.co/storage/v1/object/public/knust-mart/logo.jpg",
    data: { link: data.link || "/" },
    tag: data.link || "knustmart",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  const url = new URL(link, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
