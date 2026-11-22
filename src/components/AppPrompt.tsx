import { useEffect, useState } from "react";
import { Bell, Download, Share, X } from "lucide-react";
import { useAuth } from "../auth";
import { enablePush, pushState, PushState, syncPush } from "../push";

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const DISMISS_DAYS = 7;
const dismissed = (k: string) => { try { return Date.now() - Number(localStorage.getItem(k) || 0) < DISMISS_DAYS * 864e5; } catch { return false; } };
const remember = (k: string) => { try { localStorage.setItem(k, String(Date.now())); } catch { /* private mode */ } };
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Guides signed-in browser users to install KNUST Mart as an app, then to allow notifications. Both come from a tap, as browsers require. */
export default function AppPrompt() {
  const { me } = useAuth();
  const [ready, setReady] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [hideInstall, setHideInstall] = useState(() => dismissed("knust:install-dismissed"));
  const [hideNotify, setHideNotify] = useState(() => dismissed("knust:notify-dismissed"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { const t = window.setTimeout(() => setReady(true), 4000); return () => window.clearTimeout(t); }, []);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  useEffect(() => { if (me) void syncPush().then(() => pushState()).then(setPush); }, [me?.id, installed]); // re-link this phone to the signed-in account

  if (!me || !ready) return null;

  const close = (k: string, hide: () => void) => { remember(k); hide(); };
  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setInstalled(true); else close("knust:install-dismissed", () => setHideInstall(true));
  };
  const allow = async () => {
    setBusy(true); setErr("");
    try { await enablePush(); setPush(await pushState()); }
    catch (e) { setErr((e as Error).message); setPush(await pushState()); }
    finally { setBusy(false); }
  };

  const shell = "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-paper p-4 shadow-2xl";
  const xBtn = (onClick: () => void) => <button type="button" aria-label="Not now" onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/50 hover:bg-white"><X size={16} /></button>;

  if (!installed && !hideInstall) {
    return <section role="dialog" aria-label="Install KNUST Mart" className={shell}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">{isIos() ? <Share size={19} /> : <Download size={19} />}</div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold">Get the KNUST Mart app</p>
        <p className="mt-0.5 text-xs leading-5 text-ink/65">Opens like an app from your home screen, loads faster, and lets us alert you about orders and messages.</p>
        {installEvent
          ? <button type="button" onClick={() => void install()} className="btn-primary mt-3 px-4 py-2 text-xs">Install app</button>
          : <p className="mt-2 rounded-xl bg-[#e6ebdf] px-3 py-2 text-xs leading-5 text-ink/75">{isIos()
            ? "Tap the Share button in Safari, then “Add to Home Screen”, then open KNUST Mart from your home screen."
            : "Open your browser menu (⋮) and tap “Install app” or “Add to Home screen”."}</p>}
      </div>
      {xBtn(() => close("knust:install-dismissed", () => setHideInstall(true)))}
    </section>;
  }
  if (push === "off" && !hideNotify) {
    return <section role="dialog" aria-label="Turn on notifications" className={shell}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><Bell size={19} /></div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold">Don’t miss an order</p>
        <p className="mt-0.5 text-xs leading-5 text-ink/65">Allow notifications so you hear straight away when a seller confirms, a buyer replies or an order is ready. When your phone asks, tap Allow.</p>
        {err && <p role="alert" className="mt-1 text-xs text-red-700">{err}</p>}
        <button type="button" disabled={busy} onClick={() => void allow()} className="btn-primary mt-3 px-4 py-2 text-xs">{busy ? "Turning on…" : "Allow notifications"}</button>
      </div>
      {xBtn(() => close("knust:notify-dismissed", () => setHideNotify(true)))}
    </section>;
  }
  return null;
}
