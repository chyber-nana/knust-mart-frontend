import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Banknote, History, Info, Truck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api, Delivery, Job } from "../api";
import { useAuth } from "../auth";
import Scanner from "../components/Scanner";
import StatusBadge from "../components/StatusBadge";

export default function CourierBoard() {
  const { me, refresh } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Delivery[]>([]);
  const [scanning, setScanning] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [offerId, setOfferId] = useState<string | null>(null);
  const [dismissedOfferId, setDismissedOfferId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const acceptingOffer = useRef(false);

  const load = useCallback(async () => {
    if (!me?.is_courier) return;
    try {
      const [board, mine] = await Promise.all([
        api<Job[]>("/deliveries/board"),
        api<Delivery[]>("/deliveries/mine"),
      ]);
      setJobs(board);
      setOfferId((current) => current && board.some((job) => job.id === current)
        ? current
        : board.find((job) => job.id !== dismissedOfferId)?.id ?? null);
      setActive(mine.filter((d) => d.role === "courier" && ["accepted", "in_transit"].includes(d.status)));
    } catch (e) { setErr((e as Error).message); }
  }, [dismissedOfferId, me?.is_courier]);
  useEffect(() => {
    if (!me?.is_courier) {
      setJobs([]);
      setActive([]);
      setOfferId(null);
      return;
    }
    void load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, [load, me?.is_courier]);

  const offer = jobs.find((job) => job.id === offerId) ?? null;
  useEffect(() => {
    if (!offer?.available_at) { setCooldown(0); return; }
    const update = () => setCooldown(Math.max(0, Math.ceil((new Date(offer.available_at!).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [offer?.available_at]);

  const act = async (path: string, body?: unknown, okMsg = "") => {
    setErr(""); setMsg("");
    try { await api(path, { method: "POST", body }); setMsg(okMsg); setScanning(null); setPin(""); await load(); await refresh(); return true; }
    catch (e) { setErr((e as Error).message); return false; }
  };
  const fail = (id: string) => {
    if (confirm("Cancelling an accepted delivery suspends your account permanently. Only continue if you cannot complete it.")) act(`/deliveries/${id}/fail`);
  };
  const acceptOffer = () => {
    if (!offer || cooldown > 0 || acceptingOffer.current) return;
    acceptingOffer.current = true;
    void act(`/deliveries/${offer.id}/accept`, undefined, "Job accepted.")
      .then((accepted) => { if (accepted) setOfferId(null); })
      .finally(() => { acceptingOffer.current = false; });
  };

  if (!me) return null;
  if (!me.is_courier) return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg items-center">
      <section className="card w-full space-y-4 rounded-3xl p-6 text-center sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[30%] bg-brand/10 text-brand"><Truck size={25} /></div>
        <h1 className="font-display text-2xl font-bold">Courier</h1>
        <p className="text-sm leading-6 text-ink/65">Verified students can accept campus delivery requests and earn the listed courier payout.</p>
        {me.is_verified_student ? <button className="btn-primary w-full" onClick={() => act("/deliveries/couriers/toggle")}>Turn on courier mode</button>
          : <div role="note" className="flex items-start gap-2.5 rounded-xl border border-line bg-paper p-3.5 text-left text-sm text-ink/75"><Info size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" /><p><span className="block font-semibold text-ink">Courier mode is for verified students</span>Sign in with your @st.knust.edu.gh email and verify it to start taking deliveries.</p></div>}
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      </section>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
      <section className="card w-full space-y-5 rounded-3xl p-5 shadow-md sm:p-7">
        <header className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[30%] bg-brand/10 text-brand"><Truck size={21} /></div>
          <div className="min-w-0 flex-1"><h1 className="font-display text-xl font-bold">Courier</h1><p className="text-xs text-ink/55">Requests and active deliveries</p></div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">Online</span>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/courier/history" className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-brand/40 hover:bg-paper"><History size={17} className="text-brand" />History</Link>
          <Link to="/courier/payouts" className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-brand/40 hover:bg-paper"><Banknote size={17} className="text-brand" />Payouts</Link>
        </div>

        {msg && <p role="status" className="rounded-xl bg-brand/10 p-3 text-sm text-brand">{msg}</p>}
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Active delivery</h2><span className="text-xs text-ink/50">{active.length} active</span></div>
          {active.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-5 text-center">
            <p className="font-semibold">{jobs.length ? `${jobs.length} delivery request${jobs.length === 1 ? "" : "s"} available` : "No active deliveries"}</p>
            <p className="mt-1 text-xs text-ink/55">{jobs.length ? "New requests appear here automatically." : "New requests will appear here automatically."}</p>
            {jobs.length > 0 && <button type="button" className="btn-primary mt-3" onClick={() => { setDismissedOfferId(null); setOfferId(jobs[0].id); }}>View a request</button>}
          </div> : <ul className="space-y-3">{active.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{d.product_title || "Delivery"}</p><StatusBadge status={d.status} /></div>
              <p className="mt-1 text-xs text-ink/60">{d.pickup} → {d.dropoff}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.status === "accepted" && <button className="btn-primary" onClick={() => void act(`/deliveries/${d.id}/pickup`, undefined, "Marked as picked up.")}>I picked it up</button>}
                {d.status === "in_transit" && <button className="btn-primary" onClick={() => setScanning(scanning === d.id ? null : d.id)}>Confirm handover</button>}
                <button className="btn-danger" onClick={() => fail(d.id)}>Can't complete</button>
              </div>
              {scanning === d.id && <div className="mt-4 space-y-3">
                <Scanner onCode={(t) => void act(`/deliveries/${d.id}/scan`, { qr_token: t }, "Delivery complete.")} />
                <div className="flex gap-2">
                  <input className="input" inputMode="numeric" maxLength={6} placeholder="Buyer's 6-digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                  <button className="btn-ghost" disabled={pin.length !== 6} onClick={() => void act(`/deliveries/${d.id}/scan`, { pin_code: pin }, "Delivery complete.")}>Submit</button>
                </div>
              </div>}
            </li>))}
          </ul>}
        </section>

        <button type="button" onClick={() => void act("/deliveries/couriers/toggle")} className="w-full py-2 text-xs font-semibold text-ink/50 transition hover:text-red-700">Turn off courier mode</button>
      </section>

      {offer && <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/55 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <section role="dialog" aria-modal="true" aria-labelledby="courier-offer-title" className="w-[min(94vw,28rem)] rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[30%] bg-brand/10 text-brand"><Truck size={20} /></div>
            <div className="min-w-0 flex-1">
              <h2 id="courier-offer-title" className="font-display text-lg font-bold">Delivery request</h2>
              <p className="mt-1 truncate text-sm font-semibold">{offer.product_title}</p>
            </div>
            <button type="button" aria-label="Close delivery request" onClick={() => { setDismissedOfferId(offer.id); setOfferId(null); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white"><X size={17} /></button>
          </div>
          <p className="mt-4 rounded-xl border border-line bg-white p-3 text-sm font-medium">{offer.pickup} <span className="text-ink/35">→</span> {offer.dropoff}</p>
          <p className="mt-3 text-sm text-ink/65">Courier payout · <b className="text-ink">GH₵{Number(offer.fee).toFixed(2)}</b></p>
          {cooldown > 0
            ? <p role="status" className="mt-4 rounded-xl bg-[#f0eadc] p-3 text-center text-sm font-semibold text-gold">Accept available in {cooldown}s</p>
            : <div className="fresh-offer-pulse mt-4 rounded-2xl">
              <button
              type="button"
              onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
              onTouchEnd={(event) => {
                const endY = event.changedTouches[0]?.clientY;
                if (touchStartY.current !== null && endY !== undefined && touchStartY.current - endY > 60) acceptOffer();
                touchStartY.current = null;
              }}
              onClick={acceptOffer}
              className="flex min-h-16 w-full touch-pan-x flex-col items-center justify-center rounded-2xl bg-brand px-4 py-3 text-white shadow-sm transition hover:bg-brand/90 active:scale-[.99]"
            >
              <span className="flex items-center gap-2 font-semibold"><ArrowUp size={18} />Swipe up or tap to accept</span>
              <span className="mt-1 text-[11px] text-white/75">Fresh request · tap or swipe up</span>
              </button>
            </div>}
        </section>
      </div>}
    </div>
  );
}
