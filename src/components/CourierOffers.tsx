import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Truck } from "lucide-react";
import { api, CourierOffer } from "../api";

/** Buyer's view: couriers who offered to deliver, each with their own price. Buyer picks one. */
export default function CourierOffers({ deliveryId, onChosen }: { deliveryId: string; onChosen: () => void }) {
  const [offers, setOffers] = useState<CourierOffer[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => api<CourierOffer[]>(`/deliveries/${deliveryId}/offers`).then((r) => { setOffers(r); setErr(""); }).catch((e) => setErr(e.message)), [deliveryId]);
  useEffect(() => { void load(); const t = window.setInterval(load, 5000); return () => window.clearInterval(t); }, [load]);

  const choose = async (id: string) => {
    setBusy(id); setErr("");
    try { await api(`/deliveries/${deliveryId}/offers/${id}/choose`, { method: "POST" }); onChosen(); }
    catch (e) { setErr((e as Error).message); void load(); } finally { setBusy(null); }
  };

  return (
    <div className="w-full rounded-2xl bg-[#e6ebdf] p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold"><Truck size={16} className="text-brand" />Choose your courier</p>
      {offers === null ? <p className="mt-2 text-xs text-ink/60">Loading…</p>
        : offers.length === 0 ? <p className="mt-2 text-xs leading-5 text-ink/65">Waiting for couriers to send offers. We’ll notify you when one arrives. You pay your courier in person (cash or MoMo).</p>
          : <ul className="mt-2 space-y-2">{offers.map((o) => (
            <li key={o.id} className="flex items-center gap-3 rounded-xl bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">{o.courier_name}{o.verified_student && <BadgeCheck size={14} aria-label="Verified student" className="text-brand" />}{o.is_new && <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">New</span>}</p>
                <p className="text-xs text-ink/55">{o.completed} {o.completed === 1 ? "delivery" : "deliveries"} completed</p>
              </div>
              <b className="font-display text-lg text-brand">GH₵{Number(o.price).toFixed(2)}</b>
              <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={busy !== null} onClick={() => void choose(o.id)}>{busy === o.id ? "…" : "Choose"}</button>
            </li>))}</ul>}
      {err && <p role="alert" className="mt-2 text-xs text-red-700">{err}</p>}
    </div>
  );
}
