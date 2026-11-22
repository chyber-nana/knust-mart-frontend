import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Wallet, CalendarDays, Clock } from "lucide-react";
import { api } from "../api";

interface Sales {
  sold: number; earned: number; this_month: number; open_orders: number;
  top_product: { title: string; count: number } | null;
  items: { id: string; product_title: string; options: string; price: number; buyer_name: string; fulfillment_type: string; completed_at: string | null }[];
}

export default function SalesPage() {
  const [d, setD] = useState<Sales | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<Sales>("/deliveries/sales").then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!d) return <p className="text-sm">Loading…</p>;
  const tiles = [
    { icon: Package, label: "Items sold", value: String(d.sold) },
    { icon: Wallet, label: "Earned", value: `GH₵${Number(d.earned).toFixed(2)}` },
    { icon: CalendarDays, label: "This month", value: String(d.this_month) },
    { icon: Clock, label: "Open orders", value: String(d.open_orders) },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><ArrowLeft size={15} />Orders</Link>
      <h1 className="mb-4 font-display text-2xl font-bold">Sold items</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value }) => <div key={label} className="card rounded-2xl p-3.5"><Icon size={17} className="text-brand" /><p className="mt-2 font-display text-xl font-bold">{value}</p><p className="text-xs text-ink/55">{label}</p></div>)}
      </div>
      {d.top_product && <p className="mt-3 rounded-xl bg-[#e6ebdf] px-3 py-2 text-sm">Best seller: <b>{d.top_product.title}</b> ({d.top_product.count} sold)</p>}
      <p className="mt-1 text-[11px] text-ink/45">Earnings use each item’s current listing price and exclude delivery fees.</p>
      <h2 className="mb-2 mt-5 text-sm font-semibold">Completed sales</h2>
      {d.items.length === 0 ? <p className="card rounded-2xl px-5 py-8 text-center text-sm text-ink/60">No completed sales yet.</p> : (
        <ul className="space-y-2">{d.items.map((i) => (
          <li key={i.id} className="card flex items-center gap-3 rounded-2xl p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.product_title}{i.options ? ` (${i.options})` : ""}</p>
              <p className="truncate text-xs text-ink/55">{i.buyer_name} · {i.fulfillment_type === "pickup" ? "Pickup" : "Delivered"}{i.completed_at ? ` · ${new Date(i.completed_at).toLocaleDateString()}` : ""}</p>
            </div>
            <b className="font-display text-brand">GH₵{Number(i.price).toFixed(2)}</b>
          </li>))}</ul>
      )}
    </div>
  );
}
