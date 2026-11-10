import { useEffect, useState } from "react";
import { MessageCircle, PackageCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, Delivery } from "../api";
import { useAuth } from "../auth";

export default function OrderAlerts() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Delivery[]>([]);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) {
      setOrders([]);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const rows = await api<Delivery[]>("/deliveries/mine");
        if (active) {
          setOrders(rows.filter((order) => order.role === "seller" && order.status === "awaiting_seller"));
          setError("");
        }
      } catch (x) {
        if (active) setError((x as Error).message);
      }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [me?.id]);

  const order = orders.find((row) => row.id !== dismissedId);

  const respond = async (available: boolean) => {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await api(`/deliveries/${order.id}/seller-response`, { method: "POST", body: { available } });
      setDismissedId(order.id);
      setOrders((current) => current.filter((row) => row.id !== order.id));
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!me) return null;
  return <>
    {error && !order && <p role="alert" className="fixed bottom-20 left-4 z-[70] max-w-sm rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700 shadow-lg md:bottom-4">{error}</p>}
    {order && <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-3">
      <section role="dialog" aria-modal="true" aria-labelledby="seller-order-title" className="w-full max-w-md rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[30%] bg-brand/10 text-brand"><PackageCheck size={21} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="seller-order-title" className="font-display text-lg font-bold">New order request</h2>
            <p className="mt-1 text-sm font-semibold">{order.product_title}</p>
            <p className="mt-1 text-xs text-ink/60">{order.fulfillment_type === "courier" ? `Courier delivery · collect at ${order.pickup}` : `Buyer pickup · meet at ${order.dropoff}`}</p>
          </div>
          <button type="button" aria-label="Close order popup" onClick={() => setDismissedId(order.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white"><X size={17} /></button>
        </div>
        <p className="my-4 text-sm leading-5 text-ink/70">Can you fulfill this order? Confirming lets the buyer see progress and starts the next step.</p>
        {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => void respond(true)} className="btn-primary">{busy ? "Saving…" : "Yes, I have it"}</button>
          <button type="button" disabled={busy} onClick={() => void respond(false)} className="btn-ghost">Unavailable</button>
        </div>
        {order.buyer_id && order.product_id && <button type="button" disabled={busy} onClick={() => { setDismissedId(order.id); navigate(`/chat/${order.product_id}/${order.buyer_id}`); }} className="btn-ghost mt-2 w-full"><MessageCircle size={16} />Talk to the buyer</button>}
      </section>
    </div>}
  </>;
}
