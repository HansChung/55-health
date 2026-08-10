/* 暖暖 Web Push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "暖暖", body: "您有一則新通知", url: "/", tag: "nuannuan" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    try {
      data.body = event.data.text();
    } catch (_) {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "暖暖", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "nuannuan",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
