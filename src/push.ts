import { api } from "./api";

const b64ToBytes = (value: string) => {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

export type PushState = "unsupported" | "ios-install" | "blocked" | "off" | "on";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export async function pushState(): Promise<PushState> {
  if (isIos() && !isStandalone()) return "ios-install"; // iPhone only allows push for installed (Home Screen) web apps
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return sub && Notification.permission === "granted" ? "on" : "off";
  } catch { return "off"; }
}

export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications were blocked. Allow them in your browser settings to turn this on.");
  const { key } = await api<{ key: string }>("/push/public-key");
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  const json = sub.toJSON();
  await api("/push/subscribe", { method: "POST", body: { endpoint: json.endpoint, keys: json.keys } });
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api("/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}

/** A phone's push subscription belongs to one account at a time. Re-link it to whoever is signed in now. */
export async function syncPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const json = sub.toJSON();
    await api("/push/subscribe", { method: "POST", body: { endpoint: json.endpoint, keys: json.keys } });
  } catch { /* best effort */ }
}

/** On sign-out, stop this phone receiving the previous account's alerts (the browser permission stays). */
export async function unlinkPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await Promise.race([
      api("/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } }),
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  } catch { /* best effort */ }
}
