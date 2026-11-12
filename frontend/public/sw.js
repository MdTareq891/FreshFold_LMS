self.addEventListener("push", (event) => {
  let data = { title: "FreshFold Laundry", body: "You have an update." };
  try {
    data = event.data.json();
  } catch (e) {
    // fall back to default text above
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "FreshFold Laundry", {
      body: data.body || "",
      icon: "/pwa-icon.png",
      badge: "/pwa-icon.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
