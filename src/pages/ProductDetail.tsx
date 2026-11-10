import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Card, Meta, mediaUrl } from "../api";
import { useAuth } from "../auth";
import SellerBadge from "../components/SellerBadge";
import OrderModal from "../components/OrderModal";

interface Detail extends Card { description: string | null; images: string[]; status: string }

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const [p, setP] = useState<Detail | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [big, setBig] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  useEffect(() => {
    api<Detail>(`/products/${id}`).then(setP).catch((e) => setErr(e.message));
    api<Meta>("/products/meta").then(setMeta).catch(() => {});
  }, [id]);

  const changeStatus = async (status: string) => {
    if (!p) return;
    setErr(""); setActionMessage("");
    try {
      await api(`/products/${p.id}/status`, { method: "PATCH", body: { status } });
      setP({ ...p, status });
      setActionMessage("Listing status updated.");
    } catch (e) { setErr((e as Error).message); }
  };
  const promote = async () => {
    if (!p || !meta) return;
    setBusy(true); setErr(""); setActionMessage("");
    try {
      const result = await api<{ fee: number; payment_status: string; detail: string }>(`/products/${p.id}/promote`, { method: "POST" });
      setP({ ...p, is_promoted: true });
      setActionMessage(`Promoted for GH₵${result.fee}. ${result.detail}`);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!p || !confirm("Delete this listing? Listings with delivery, chat, or review history cannot be deleted.")) return;
    setBusy(true); setErr("");
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      nav(`/vendors/${p.seller.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  if (err && !p) return <p className="text-sm text-red-700">{err}</p>;
  if (!p) return <p className="text-sm">Loading…</p>;
  const mine = me?.id === p.seller.id;
  return (
    <div className="grid gap-5 md:grid-cols-[1.05fr_.95fr] md:gap-9">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-line bg-[#eae8e0]">{p.images[big] && <img src={mediaUrl(p.images[big])} alt={p.title} className="h-full w-full object-cover" />}{p.condition && <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">{p.condition}</span>}</div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{p.images.map((u, i) => (
          <button key={u} aria-label={`View photo ${i + 1}`} onClick={() => setBig(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === big ? "border-brand" : "border-transparent opacity-65 hover:opacity-100"}`}><img src={mediaUrl(u)} alt="" className="h-full w-full object-cover" /></button>
        ))}</div>
      </div>
      <div className="space-y-4 md:sticky md:top-24 md:self-start">
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.17em] text-gold">{p.category}{p.hall_location && <> <span className="px-1 text-ink/30">/</span> {p.hall_location}</>}</p><h1 className="font-display text-3xl font-bold leading-tight tracking-[-.03em] sm:text-4xl">{p.title}</h1><p className="mt-3 font-display text-3xl font-bold text-brand">GH₵{p.price.toFixed(2)}</p></div>
        {p.description && <p className="whitespace-pre-line text-sm leading-6 text-ink/70">{p.description}</p>}
        <Link to={`/vendors/${p.seller.id}`} className="card flex items-center justify-between rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/45">Sold by</span><span className="mt-1 block text-sm font-semibold">{p.seller.name}</span></span><SellerBadge type={p.seller.user_type} /></Link>
        {!mine && <Link
          to={me ? `/chat/${p.id}/${p.seller.id}` : "/login"}
          state={!me ? { from: `/chat/${p.id}/${p.seller.id}` } : undefined}
          className="btn-ghost w-full"
        >Message seller</Link>}
        <p className="rounded-2xl border border-[#d6dfcd] bg-[#edf1e8] p-4 text-xs leading-5 text-ink/70"><b className="text-brand">Meet safely.</b> Choose a busy public campus spot such as the Main Library or Student Union Building. Inspect the item before paying.</p>
        {mine ? <div className="card space-y-3 p-4">
            <p className="text-sm font-semibold">Manage your listing</p>
            <Link to={`/products/${p.id}/edit`} className="btn-ghost w-full">Edit listing</Link>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <select className="input" value={p.status} onChange={(e) => changeStatus(e.target.value)}>
                <option value="active">Active</option><option value="reserved">Reserved</option><option value="sold">Sold</option>
              </select>
            </label>
            <p className="text-xs text-ink/60">{me?.user_type === "student" ? "Student" : "External vendor"} promotion rate: GH₵{meta?.fees[me!.user_type]?.promotion ?? "–"}. Payment is a stub and is not connected.</p>
            <button className="btn-primary w-full" disabled={busy || p.is_promoted || p.status === "sold"} onClick={promote}>{p.is_promoted ? "Already promoted" : busy ? "Promoting…" : "Promote listing"}</button>
            <button className="btn-danger w-full" disabled={busy} onClick={remove}>Delete listing</button>
            {actionMessage && <p role="status" className="text-sm text-brand">{actionMessage}</p>}
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          </div> : p.status !== "active" ? <p className="text-sm font-semibold text-red-700">This item is no longer available.</p> : (
          <button type="button" className="btn-primary w-full" onClick={() => { setOrderOpen(true); setErr(""); }}>Order</button>)}
      </div>
      {orderOpen && <OrderModal product={p} meta={meta} onClose={() => setOrderOpen(false)} />}
    </div>
  );
}
