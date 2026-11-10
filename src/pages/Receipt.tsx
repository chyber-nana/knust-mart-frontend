import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import ReviewModal from "../components/ReviewModal";

interface R {
  status: string;
  role: "buyer" | "seller";
  fulfillment_type: "courier" | "pickup";
  product_id: string;
  product_title: string;
  vendor_name: string;
  pickup: string;
  dropoff: string;
  fee: number;
  buyer_id: string | null;
  qr_token: string | null;
  pin_code: string | null;
  reviewed?: boolean;
}

export default function Receipt() {
  const { id } = useParams();
  const toast = useToast();
  const previousStatus = useRef<string | null>(null);
  const [r, setR] = useState<R | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const load = useCallback(() => api<R>(`/deliveries/${id}/receipt`).then((result) => {
    if (previousStatus.current && previousStatus.current !== "delivered" && result.status === "delivered") {
      toast("Order received", "Your delivery has been completed.");
    }
    previousStatus.current = result.status;
    setR(result);
  }).catch((e) => setErr(e.message)), [id, toast]);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const report = async () => {
    if (!confirm("Report this delivery as stolen? The courier's account will be suspended immediately.")) return;
    try { await api(`/deliveries/${id}/report-stolen`, { method: "POST" }); load(); } catch (e) { setErr((e as Error).message); }
  };
  const confirmPickup = async () => {
    if (!confirm("Confirm that you collected the item from the seller?")) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/deliveries/${id}/confirm-pickup`, { method: "POST" });
      await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const respondToOrder = async (available: boolean) => {
    if (!available && !confirm("Mark this item as unavailable and release the buyer's order?")) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/deliveries/${id}/seller-response`, { method: "POST", body: { available } });
      await load();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!r) return <p className="text-sm">Loading…</p>;
  const done = r.status === "delivered";
  const showReview = done && r.role === "buyer" && !r.reviewed && !reviewDismissed;
  const canReport = r.role === "buyer" && r.fulfillment_type === "courier" && ["in_transit", "delivered", "failed"].includes(r.status);
  const steps = r.fulfillment_type === "pickup"
    ? [{ key: "awaiting_seller", label: "Seller confirming" }, { key: "ready_for_pickup", label: "Ready for pickup" }, { key: "delivered", label: "Picked up" }]
    : [{ key: "awaiting_seller", label: "Seller confirming" }, { key: "pending", label: "Finding courier" }, { key: "accepted", label: "Courier assigned" }, { key: "in_transit", label: "On the way" }, { key: "delivered", label: "Delivered" }];
  const progressIndex = r.status === "ready_for_pickup" ? 1 : r.status === "accepted" ? 2 : r.status === "in_transit" ? 3 : r.status === "delivered" ? steps.length - 1 : steps.findIndex((step) => step.key === r.status);
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 text-center"><div className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[30%] ${done ? "bg-[#e6ebdf] text-brand" : "bg-[#f0eadc] text-gold"}`}>{done ? <CheckCircle2 size={26} /> : <ShieldCheck size={26} />}</div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-gold">{r.role === "seller" ? "Order progress" : r.fulfillment_type === "pickup" ? "Seller pickup" : "Campus handover"}</p><h1 className="font-display text-2xl font-bold">{r.product_title}</h1><div className="mt-2"><StatusBadge status={r.status} /></div></div>
      <section className="card mb-4 rounded-2xl p-4">
        <h2 className="mb-4 text-sm font-semibold">Order progress</h2>
        <ol className="space-y-3">
          {steps.map((step, index) => <li key={step.key} className="flex items-center gap-3">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${index <= progressIndex && !["failed", "disputed"].includes(r.status) ? "bg-brand text-white" : "border border-line text-ink/35"}`}>{index < progressIndex ? "✓" : index + 1}</span>
            <span className={`text-sm ${index === progressIndex ? "font-semibold text-ink" : "text-ink/55"}`}>{step.label}</span>
          </li>)}
        </ol>
        {["failed", "disputed"].includes(r.status) && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{r.status === "failed" ? "This order could not be completed." : "This order is under review."}</p>}
        <p className="mt-4 border-t border-line pt-3 text-xs text-ink/60">{r.fulfillment_type === "pickup" ? `Meet at ${r.dropoff} · Free` : `${r.pickup} → ${r.dropoff} · GH₵${Number(r.fee).toFixed(2)}`}</p>
        {r.role === "seller" && r.buyer_id && <Link className="btn-ghost mt-3 w-full" to={`/chat/${r.product_id}/${r.buyer_id}`}>Message buyer</Link>}
      </section>
      {r.role === "seller" && r.status === "awaiting_seller" && <div className="card mb-4 space-y-2 rounded-2xl p-4">
        <p className="text-sm font-semibold">Can you fulfill this order?</p>
        <button type="button" disabled={busy} onClick={() => void respondToOrder(true)} className="btn-primary w-full">Yes, I have it</button>
        <button type="button" disabled={busy} onClick={() => void respondToOrder(false)} className="btn-ghost w-full">Mark unavailable</button>
      </div>}
      {r.fulfillment_type === "pickup" && r.role === "buyer" && r.status === "ready_for_pickup" && <button type="button" disabled={busy} onClick={() => void confirmPickup()} className="btn-primary mb-4 w-full">{busy ? "Confirming…" : "I picked it up"}</button>}
      {r.fulfillment_type === "courier" && r.role === "buyer" && (r.status === "in_transit" || done) && <div className="card rounded-2xl p-5 text-center sm:p-7">
        {done ? <div className="py-8"><CheckCircle2 className="mx-auto text-brand" size={38} /><p className="mt-3 font-display text-xl font-bold text-brand">Safely handed over</p><p className="mt-1 text-sm text-ink/60">This QR code and PIN have been used.</p></div> : (
          <>
            <p className="mx-auto mb-4 max-w-xs text-sm leading-5 text-ink/65">Show this pass to your courier only when the item is in your hands.</p>
            {r.qr_token && <div className="inline-block rounded-2xl border border-line bg-white p-3"><QRCodeSVG value={r.qr_token} size={200} /></div>}
            <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-ink/35"><span className="h-px flex-1 bg-line" />camera-free handover<span className="h-px flex-1 bg-line" /></div>
            {r.pin_code && <><p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Your private 6-digit PIN</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-[0.28em] text-brand">{r.pin_code}</p>
            <p className="mt-2 text-[11px] text-ink/45">Don’t share this PIN before you receive your item.</p></>}
          </>
        )}
      </div>}
      {canReport && <button onClick={report} className="btn-danger mt-4 w-full rounded-xl"><AlertTriangle size={16} />Items missing or stolen? Report</button>}
      {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
      {showReview && <ReviewModal
        deliveryId={id ?? ""}
        productTitle={r.product_title}
        sellerName={r.vendor_name}
        onClose={() => setReviewDismissed(true)}
        onSubmitted={() => {
          setR((current) => current ? { ...current, reviewed: true } : current);
          setReviewDismissed(true);
          toast("Review submitted", "Thanks for sharing your experience.");
        }}
      />}
    </div>
  );
}
