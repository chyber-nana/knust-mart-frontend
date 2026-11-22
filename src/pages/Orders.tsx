import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LineChart, PackageCheck } from "lucide-react";
import { api, Delivery } from "../api";
import { useAuth } from "../auth";
import StatusBadge from "../components/StatusBadge";
import ReviewModal from "../components/ReviewModal";
import { nextStep } from "../components/NextStep";
import { useRealtime } from "../realtime";

const DONE = ["delivered", "cancelled", "failed", "disputed"];
const ROLE_LABEL = { buyer: "Buying", seller: "Selling", courier: "Delivering" } as const;

export default function Orders() {
  const { me } = useAuth();
  const [rows, setRows] = useState<Delivery[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"active" | "done">("active");
  const [reviewOrder, setReviewOrder] = useState<Delivery | null>(null);
  const dismissedReviews = useRef(new Set<string>());
  const load = useCallback(() => api<Delivery[]>("/deliveries/mine").then((result) => {
    setRows(result);
    setErr("");
    setReviewOrder((current) => current ?? result.find((row) =>
      row.role === "buyer" && row.status === "delivered" && !row.reviewed && !dismissedReviews.current.has(row.id),
    ) ?? null);
  }).catch((e) => setErr(e.message)), []);
  useEffect(() => { void load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [load]);
  useRealtime(() => { void load(); });
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!rows) return <p className="text-sm">Loading…</p>;
  const closeReview = () => { if (reviewOrder) dismissedReviews.current.add(reviewOrder.id); setReviewOrder(null); };
  const completeReview = () => {
    if (reviewOrder) {
      dismissedReviews.current.add(reviewOrder.id);
      setRows((current) => current?.map((row) => row.id === reviewOrder.id ? { ...row, reviewed: true } : row) ?? null);
    }
    setReviewOrder(null);
  };
  const active = rows.filter((d) => !DONE.includes(d.status));
  const done = rows.filter((d) => DONE.includes(d.status));
  const shown = tab === "active" ? active : done;
  const sells = me?.store_active || rows.some((d) => d.role === "seller");
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-[30%] bg-[#e6ebdf] text-brand"><PackageCheck size={21} /></div>
        <h1 className="flex-1 font-display text-2xl font-bold">Orders</h1>
        {sells && <Link to="/sales" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand"><LineChart size={14} />Sold items</Link>}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1 text-sm font-semibold" role="tablist">
        {([["active", `In progress (${active.length})`], ["done", `Completed (${done.length})`]] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`rounded-lg py-2 ${tab === key ? "bg-white text-brand shadow-sm" : "text-ink/55"}`}>{label}</button>
        ))}
      </div>
      {shown.length === 0 && <div className="card rounded-2xl px-5 py-10 text-center"><p className="font-display text-lg font-bold">{tab === "active" ? "Nothing in progress" : "No completed orders yet"}</p></div>}
      <ul className="space-y-2.5">
        {shown.map((d) => {
          const step = nextStep({ role: d.role, status: d.status, fulfillment_type: d.fulfillment_type, released: d.released, pickup: d.pickup, dropoff: d.dropoff, dropoff_note: d.dropoff_note });
          return (
            <li key={d.id} className="card rounded-2xl">
              <Link to={d.role === "courier" ? "/courier" : `/orders/${d.id}`} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.product_title ?? "Order"}{d.options ? ` (${d.options})` : ""}</p>
                  <p className="mt-0.5 truncate text-xs text-ink/60"><span className="font-semibold text-brand">{ROLE_LABEL[d.role]}</span>{step && !DONE.includes(d.status) ? ` · ${step.title}` : ""}</p>
                </div>
                <StatusBadge status={d.status} /><ChevronRight size={16} className="shrink-0 text-ink/40" />
              </Link>
              {d.role === "buyer" && d.status === "delivered" && !d.reviewed && <button type="button" onClick={() => setReviewOrder(d)} className="w-full border-t border-line py-2 text-xs font-semibold text-brand">Review seller</button>}
            </li>
          );
        })}
      </ul>
      {reviewOrder && <ReviewModal deliveryId={reviewOrder.id} productTitle={reviewOrder.product_title ?? "Your order"} sellerName={reviewOrder.vendor_name ?? "Seller"} onClose={closeReview} onSubmitted={completeReview} />}
    </>
  );
}
