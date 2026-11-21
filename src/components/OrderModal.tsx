import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import { api, Card, HALLS, HOSTELS, mediaUrl, Meta } from "../api";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import LocationPicker from "./LocationPicker";
const CAMPUS_NAMES = [...HALLS, ...HOSTELS, "Evandy", "Queen Elizabeth II", "Main Library", "Student Union Building"].map((n) => n.toLowerCase());

type OrderProduct = Card & { images?: string[]; status?: string };

export default function OrderModal({
  product,
  meta,
  onClose,
  showProductLink = false,
}: {
  product: OrderProduct;
  meta: Meta | null;
  onClose: () => void;
  showProductLink?: boolean;
}) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [location, setLocation] = useState("");
  const [fulfillment, setFulfillment] = useState<"courier" | "pickup">("courier");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState(false);
  const [note, setNote] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const image = product.images?.[0] ?? product.image;
  const pickupLocation = product.seller.pickup_location || product.hall_location;
  const isMine = me?.id === product.seller.id;
  const isAvailable = !product.status || product.status === "active";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const placeOrder = async () => {
    if ((product.colors?.length && !color) || (product.sizes?.length && !size)) { setError(`Please choose a ${product.colors?.length && !color ? "colour" : "size"}.`); return; }
    if (!meta || (fulfillment === "courier" && !location) || (fulfillment === "pickup" && !pickupLocation)) return;
    setBusy(true);
    setError("");
    try {
      const delivery = await api<{ id: string }>("/deliveries", {
        method: "POST",
        body: {
          product_id: product.id,
          pickup_location: pickupLocation,
          dropoff_location: fulfillment === "courier" ? location : undefined,
          fulfillment_type: fulfillment,
          choose_courier: fulfillment === "courier" && compare,
          dropoff_note: fulfillment === "courier" && note.trim() ? note.trim() : undefined,
          color: color || undefined,
          size: size || undefined,
        },
      });
      notify("Order requested", fulfillment === "courier" ? `Pay at handover: GH₵${(product.price + (meta?.delivery_fee ?? 5)).toFixed(2)} (item + delivery), by MoMo or cash. Only pay once the item is in your hand.` : `Pay GH₵${product.price.toFixed(2)} to the seller by MoMo or cash when you collect it.`);
      navigate(`/orders/${delivery.id}`);
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="order-modal-title" className="modal-panel relative flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl">
        <div className="relative h-40 shrink-0 bg-[#eae8e0] sm:aspect-[4/3] sm:h-auto">
          {image && <img src={mediaUrl(image)} alt={product.title} className="h-full w-full object-cover" />}
          <button type="button" aria-label="Close order popup" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto p-3 sm:space-y-2.5 sm:p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink/60">{product.seller.name}</p>
              <h2 id="order-modal-title" className="mt-1 line-clamp-2 font-display text-lg font-bold">{product.title}</h2>
            </div>
            <p className="shrink-0 font-display text-lg font-bold text-brand">GH₵{product.price.toFixed(2)}</p>
          </div>
          {isMine ? <p className="text-sm text-ink/65">This is your listing.</p>
            : !isAvailable ? <p className="text-sm font-semibold text-red-700">This listing is no longer available.</p>
              : me ? <>
                {([["Colour", product.colors, color, setColor], ["Size", product.sizes, size, setSize]] as const).map(([label, list, value, set]) => list && list.length > 0 && <div key={label}><p className="mb-1 text-xs font-semibold text-ink/60">{label}</p><div className="flex flex-wrap gap-1.5">{list.map((v) => <button key={v} type="button" aria-pressed={value === v} onClick={() => set(v)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${value === v ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70"}`}>{v}</button>)}</div></div>)}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={fulfillment === "courier"} onClick={() => setFulfillment("courier")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${fulfillment === "courier" ? "border-brand bg-brand/5 text-brand" : "border-line text-ink/60"}`}>Courier · GH₵{meta?.delivery_fee.toFixed(2) ?? "–"}</button>
                  <button type="button" aria-pressed={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${fulfillment === "pickup" ? "border-brand bg-brand/5 text-brand" : "border-line text-ink/60"}`}>Pickup · Free</button>
                </div>
                {fulfillment === "courier" ? (
<div className="flex items-start gap-2 rounded-xl border border-line bg-white px-3 py-2">
  <MapPin size={17} className="mt-2 shrink-0 text-brand" />
  <div className="min-w-0 flex-1"><LocationPicker value={location} onChange={setLocation} placeholder="Choose your hall or hostel" selectClass="w-full bg-transparent py-1 text-sm outline-none" inputClass="w-full border-t border-line bg-transparent py-1 text-sm outline-none" /></div>
</div>
                ) : (
                  <p className="rounded-xl border border-line bg-white px-3 py-3 text-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink/50">Pickup location</span>
                    <span className="mt-1 flex items-center gap-2"><MapPin size={16} className="shrink-0 text-brand" />{pickupLocation || "Seller has not added a pickup location"}</span>
                  </p>
                )}
                {fulfillment === "courier" && location && !CAMPUS_NAMES.includes(location.trim().toLowerCase()) && <p role="note" className="rounded-xl bg-[#f0eadc] px-3 py-2.5 text-xs leading-5 text-ink/75">Couriers only deliver between campus halls and hostels. For anywhere else, choose Pickup instead.</p>}
                {fulfillment === "courier" && <input className="input py-2 text-sm" maxLength={120} placeholder="Room number or landmark (optional)" value={note} onChange={(e) => setNote(e.target.value)} />}
                {fulfillment === "courier" && <label className="flex items-center gap-2 text-xs text-ink/65"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />Let me compare courier prices (optional)</label>}
                <button type="button" className="btn-primary w-full" disabled={(fulfillment === "courier" && (!location || !CAMPUS_NAMES.includes(location.trim().toLowerCase()))) || (fulfillment === "pickup" && !pickupLocation) || !meta || busy} onClick={placeOrder}>{busy ? "Ordering…" : "Order"}</button>
              </> : <Link to="/login" state={{ from: `/products/${product.id}` }} className="btn-primary w-full">Sign in to order</Link>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {showProductLink && <Link to={`/products/${product.id}`} onClick={onClose} className="btn-ghost w-full">View product</Link>}
        </div>
      </section>
    </div>
  );
}
