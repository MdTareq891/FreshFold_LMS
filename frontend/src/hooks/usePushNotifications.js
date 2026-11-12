import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(enabled) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported || !enabled) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [supported, enabled]);

  const subscribe = useCallback(async () => {
    if (!supported) return { ok: false, reason: "unsupported" };
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return { ok: false, reason: "denied" };

      const reg = await navigator.serviceWorker.ready;
      const { data } = await client.get("/push/vapid-public-key");
      if (!data.publicKey) return { ok: false, reason: "server-not-configured" };

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      }
      await client.post("/push/subscribe", sub.toJSON());
      setSubscribed(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }, [supported]);

  return { supported, permission, subscribed, subscribe };
}
