import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, PackageCheck } from "lucide-react";
import { api, canBuyerCancelDelivery, Delivery } from "../api";
import StatusBadge from "../components/StatusBadge";
import ReviewModal from "../components/ReviewModal";
import CourierOffers from "../components/CourierOffers";

export default function Orders() {
  const [rows, setRows] = useState<Delivery[] | null>(null);
  const [err, setErr] = useState("");
  const [reviewOrder, setReviewOrder] = useState<Delivery | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const dismissedReviews = useRef(new Set<string>());
  const load = useCallback(() => api<Delivery[]>("/deliveries/mine").then((result) => {
    setRows(result);
    setErr("");
    setReviewOrder((current) => current ?? result.find((row) =>
      row.role === "buyer" && row.status === "delivered" && !row.reviewed && !dismissedReviews.current.has(row.id),
    ) ?? null);
  }).catch((e) => setErr(e.message)), []);
  useEffect(() => { void load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [load]);
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!rows) return <p className="text-sm">Loading…</p>;
  const closeReview = () => {
    if (reviewOrder) dismissedReviews.current.add(reviewOrder.id);
    setReviewOrder(null);
  };
  const completeReview = () => {
    if (reviewOrder) {
      dismissedReviews.current.add(reviewOrder.id);
      setRows((current) => current?.map((row) => row.id === reviewOrder.id ? { ...row, reviewed: true } : row) ?? null);
    }
    setReviewOrder(null);
  };
  const cancelOrder = async (delivery: Delivery) => {
    const message = delivery.fulfillment_type === "courier"
      ? "Cancel this order? You can cancel only before the item is handed to the courier."
      : "Cancel this pickup order?";
    if (!confirm(message)) return;
    setCancellingId(delivery.id);
    setErr("");
    try {
      await api(`/deliveries/${delivery.id}/cancel`, { method: "POST" });
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setCancellingId(null);
    }
  };
  return (
    <>
      <div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[30%] bg-[#e6ebdf] text-brand"><PackageCheck size={21} /></div><h1 className="font-display text-2xl font-bold">Your orders</h1></div>
      {rows.length === 0 && <div className="card rounded-2xl px-5 py-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-[30%] bg-paper text-brand"><PackageCheck size={22} /></div><p className="mt-3 font-display text-lg font-bold">No deliveries yet</p></div>}
      <ul className="space-y-3">
        {rows.map((d) => (
          <li key={d.id} className="card flex flex-wrap items-center gap-3 p-4">
            <Link to={d.role === "courier" ? "/courier" : `/orders/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold">{d.product_title ? `${d.product_title} · ` : ""}{d.pickup} → {d.dropoff}</p>
                <p className="text-xs capitalize text-ink/60">{d.role} · {d.fulfillment_type === "pickup" ? "pickup" : `courier · GH₵${Number(d.fee).toFixed(2)}`}</p>
              </div>
              <StatusBadge status={d.status} /><ChevronRight size={16} />
            </Link>
            {d.role === "buyer" && d.fulfillment_type === "courier" && d.status === "pending" && (d.choose_courier
              ? <CourierOffers deliveryId={d.id} onChosen={() => void load()} />
              : <p className="w-full rounded-2xl bg-[#e6ebdf] p-3 text-xs leading-5 text-ink/70">Finding you a courier at GH₵{Number(d.fee).toFixed(2)}. We’ll notify you when one accepts. <button type="button" className="font-semibold text-brand underline" onClick={() => api(`/deliveries/${d.id}/choose-mode`, { method: "POST" }).then(() => load()).catch(() => undefined)}>Compare courier prices instead</button></p>)}
            {d.role === "buyer" && d.status === "delivered" && <button type="button" disabled={d.reviewed} onClick={() => setReviewOrder(d)} className="text-sm font-semibold text-brand hover:underline disabled:cursor-default disabled:text-ink/40">{d.reviewed ? "Reviewed" : "Review seller"}</button>}
            {canBuyerCancelDelivery(d) && <button type="button" disabled={cancellingId === d.id} onClick={() => void cancelOrder(d)} className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50">{cancellingId === d.id ? "Cancelling…" : "Cancel order"}</button>}
          </li>
        ))}
      </ul>
      {reviewOrder && <ReviewModal
        deliveryId={reviewOrder.id}
        productTitle={reviewOrder.product_title ?? "Your order"}
        sellerName={reviewOrder.vendor_name ?? "Seller"}
        onClose={closeReview}
        onSubmitted={completeReview}
      />}
    </>
  );
}
