import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";

type State = "checking" | "active" | "flagged" | "timeout" | "error";

export default function StoreActivated() {
  const [params] = useSearchParams();
  const reference = params.get("reference");
  const { refresh } = useAuth();
  const [state, setState] = useState<State>("checking");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!reference) { setState("error"); setErr("Missing payment reference."); return; }
    let alive = true;
    (async () => {
      // The webhook can arrive a moment after the redirect, so check a few times.
      for (let i = 0; i < 10 && alive; i++) {
        try {
          const result = await api<{ status: string; store_active: boolean }>(`/payments/verify/${encodeURIComponent(reference)}`);
          if (result.store_active) { await refresh(); if (alive) setState("active"); return; }
          if (result.status === "flagged") { if (alive) setState("flagged"); return; }
        } catch (x) {
          if (alive) { setErr((x as Error).message); setState("error"); }
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }
      if (alive) setState("timeout");
    })();
    return () => { alive = false; };
  }, [reference]);

  return (
    <div className="mx-auto mt-10 max-w-sm text-center">
      <div className="card wake-tip rounded-2xl p-6">
        {state === "checking" && <>
          <Loader2 className="mx-auto animate-spin text-brand" size={36} aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-ink/65">This usually takes a few seconds. Please don’t close this page.</p>
        </>}
        {state === "active" && <>
          <CheckCircle2 className="mx-auto text-brand" size={42} aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold">Your business is live 🎉</h1>
          <p className="mt-2 text-sm text-ink/65">Payment received. Add a logo and banner, then list your first product.</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/store/edit" className="btn-primary">Set up my storefront</Link>
            <Link to="/sell" className="btn-ghost">Add a product</Link>
          </div>
        </>}
        {state === "timeout" && <>
          <AlertTriangle className="mx-auto text-gold" size={36} aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold">We haven’t seen your payment yet</h1>
          <p className="mt-2 text-sm text-ink/65">If you were charged, your store will switch on automatically within a few minutes. If you cancelled, you can try again.</p>
          <div className="mt-5 flex flex-col gap-2">
            <button className="btn-primary" onClick={() => window.location.reload()}>Check again</button>
            <Link to="/store/create" className="btn-ghost">Back to checkout</Link>
          </div>
        </>}
        {state === "flagged" && <>
          <AlertTriangle className="mx-auto text-gold" size={36} aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold">We need to review this payment</h1>
          <p className="mt-2 text-sm text-ink/65">The amount didn’t match what we expected, so we’ve paused activation. Please contact support with your payment reference.</p>
          <p className="mt-2 break-all text-xs text-ink/50">{reference}</p>
        </>}
        {state === "error" && <>
          <AlertTriangle className="mx-auto text-red-600" size={36} aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold">Something went wrong</h1>
          <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>
          <Link to="/store/create" className="btn-ghost mt-5 inline-flex">Back to checkout</Link>
        </>}
      </div>
    </div>
  );
}
