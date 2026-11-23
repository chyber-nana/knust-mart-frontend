import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Card, Meta, mediaUrl, whatsappUrl } from "../api";
import { useAuth } from "../auth";
import SellerBadge from "../components/SellerBadge";
import OrderModal from "../components/OrderModal";
import { usePageMeta } from "../seo";
import { MessageCircle, Phone } from "lucide-react";

interface Detail extends Card { description: string | null; images: string[]; status: string; colors?: string[]; sizes?: string[] }

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const [p, setP] = useState<Detail | null>(null);
  usePageMeta(p ? `${p.title} | GH₵${Number(p.price).toFixed(2)} on KNUST Mart` : undefined, p ? (p.description || `${p.title} for sale on KNUST Mart, the KNUST campus marketplace.`) : undefined);
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
  let redirecting = false;
  try {
    const result = await api<{ status: "payment_required" | "promoted"; authorization_url?: string }>(`/products/${p.id}/promote`, { method: "POST" });
    if (result.status === "payment_required" && result.authorization_url) {
      redirecting = true;
      window.location.assign(result.authorization_url);
      return;
    }
    setP({ ...p, is_promoted: true });
    setActionMessage("Your listing is now promoted.");
  } catch (e) { setErr((e as Error).message); }
  finally { if (!redirecting) setBusy(false); }
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
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.17em] text-gold">{p.category}{p.hall_location && <> <span className="px-1 text-ink/30">/</span> {p.hall_location}</>}</p><h1 className="font-display text-3xl font-bold leading-tight tracking-[-.03em] sm:text-4xl">{p.title}</h1><p className="mt-3 font-display text-3xl font-bold text-brand">GH₵{p.price.toFixed(2)}</p>{p.stock != null && <p className={`mt-1 text-sm font-semibold ${p.stock > 0 ? "text-ink/60" : "text-red-700"}`}>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>}</div>
        {p.description && <p className="whitespace-pre-line text-sm leading-6 text-ink/70">{p.description}</p>}
        {([["Colours", p.colors], ["Sizes", p.sizes]] as const).map(([label, list]) => list && list.length > 0 && <div key={label} className="flex flex-wrap items-center gap-1.5 text-sm"><span className="font-semibold">{label}:</span>{list.map((v) => <span key={v} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-semibold">{v}</span>)}</div>)}
        <Link to={`/vendors/${p.seller.id}`} className="card flex items-center justify-between rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/45">Sold by</span><span className="mt-1 block text-sm font-semibold">{p.seller.name}</span></span><SellerBadge type={p.seller.user_type} /></Link>
        {(p.seller.phone_number || p.seller.whatsapp_number) && <div className="flex flex-wrap gap-2">
          {p.seller.phone_number && <a className="btn-ghost" href={`tel:${p.seller.phone_number}`}><Phone size={16} />Call seller</a>}
          {p.seller.whatsapp_number && <a className="btn-ghost" href={whatsappUrl(p.seller.whatsapp_number)} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>}
        </div>}
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
            promotion: GH₵{meta?.fees[me!.user_type]?.promotion ?? "–"} one-time. You’ll pay securely with Paystack.
            {p.is_promoted ? "Already promoted" : busy ? "One moment…" : `Promote for GH₵${meta?.fees[me!.user_type]?.promotion ?? ""}`}
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
