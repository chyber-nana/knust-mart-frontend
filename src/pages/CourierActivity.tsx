import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Banknote, History } from "lucide-react";
import { api, Delivery, Payout } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function CourierActivity({ mode }: { mode: "history" | "payouts" }) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const request = mode === "history"
      ? api<Delivery[]>("/deliveries/mine").then((rows) => setDeliveries(rows.filter((row) => row.role === "courier")))
      : api<Payout[]>("/deliveries/payouts").then(setPayouts);
    request.catch((e) => setError((e as Error).message));
  }, [mode]);

  const isHistory = mode === "history";
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/courier" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-brand"><ArrowLeft size={16} />Courier</Link>
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-[30%] bg-brand/10 text-brand">{isHistory ? <History size={21} /> : <Banknote size={21} />}</div>
        <h1 className="font-display text-2xl font-bold">{isHistory ? "Delivery history" : "Payouts"}</h1>
      </header>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {isHistory
        ? deliveries === null ? <p className="card p-4 text-sm text-ink/60">Loading history…</p>
          : deliveries.length === 0 ? <p className="card p-5 text-sm text-ink/60">Completed courier jobs will appear here.</p>
            : <ul className="space-y-2">{deliveries.map((delivery) => <li key={delivery.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{delivery.product_title || "Delivery"}</p><p className="text-xs text-ink/60">{delivery.pickup} → {delivery.dropoff}</p></div>
              <StatusBadge status={delivery.status} />
            </li>)}</ul>
        : payouts === null ? <p className="card p-4 text-sm text-ink/60">Loading payouts…</p>
          : payouts.length === 0 ? <p className="card p-5 text-sm text-ink/60">Completed delivery payouts will appear here.</p>
            : <><p className="text-xs text-ink/55">Payouts are recorded here. Payment processing is not connected.</p><ul className="space-y-2">{payouts.map((payout) => <li key={payout.delivery_id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{payout.product_title}</p><p className="text-xs text-ink/60">{new Date(payout.created_at).toLocaleDateString()}</p></div>
              <div className="text-right"><p className="text-sm font-semibold">GH₵{Number(payout.amount).toFixed(2)}</p><p className="text-xs capitalize text-ink/60">{payout.status}</p></div>
            </li>)}</ul></>}
    </div>
  );
}
