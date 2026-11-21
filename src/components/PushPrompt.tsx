import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useAuth } from "../auth";
import { enablePush, pushState, PushState } from "../push";

const DISMISS_KEY = "knust:push-dismissed";

/** Small dismissible banner asking signed-in users to turn on phone notifications. */
export default function PushPrompt() {
  const { me } = useAuth();
  const [state, setState] = useState<PushState | null>(null);
  const [hidden, setHidden] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) { setHidden(true); return; }
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch { /* ignore */ }
    pushState().then((s) => { setState(s); setHidden(dismissed || s === "on" || s === "unsupported" || s === "blocked"); });
  }, [me?.id]);

  if (hidden || !me || !state) return null;
  const dismiss = () => { setHidden(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
  const turnOn = async () => {
    setBusy(true); setErr("");
    try { await enablePush(); setHidden(true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div role="region" aria-label="Phone notifications" className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-line bg-white p-3.5 shadow-xl md:bottom-6 md:left-auto md:right-6 md:mx-0">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[30%] bg-[#e6ebdf] text-brand"><BellRing size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Get alerts on your phone</p>
          <p className="mt-0.5 text-xs leading-5 text-ink/65">
            {state === "ios-install"
              ? "On iPhone: tap Share, then “Add to Home Screen”, and open KNUST Mart from there to turn on alerts for orders, offers and messages."
              : "Know the moment you get an order, a courier offer or a message, even when the app is closed."}
          </p>
          {err && <p role="alert" className="mt-1 text-xs text-red-700">{err}</p>}
          {state !== "ios-install" && <button type="button" onClick={turnOn} disabled={busy} className="btn-primary mt-2.5 px-4 py-2 text-xs">{busy ? "Turning on…" : "Turn on notifications"}</button>}
        </div>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-paper"><X size={15} /></button>
      </div>
    </div>
  );
}
