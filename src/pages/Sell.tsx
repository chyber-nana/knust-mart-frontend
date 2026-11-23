import OptionChips, { COLOR_SUGGESTIONS, SIZE_SUGGESTIONS } from "../components/OptionChips";
import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, MapPin, X } from "lucide-react";
import { api, Meta, mediaUrl, upload } from "../api";
import { useAuth } from "../auth";
import SellerBadge from "../components/SellerBadge";
import LocationPicker from "../components/LocationPicker";
import PhotoTiles from "../components/PhotoTiles";
import ImageCropDialog from "../components/ImageCropDialog";
import { KIND_LABEL, KindIcon, ListingKind, SERVICE_CATEGORY } from "../components/ListingKind";

const PRODUCT_STEPS = ["Type", "Photos", "Details", "Location & fees", "Preview"];
const SERVICE_STEPS = ["Type", "Photos", "Details", "Preview"];
const KIND_COPY: Record<ListingKind, string> = { product: "Physical items: books, gadgets, clothing, room essentials.", service: "Something you do: tutoring, braiding, repairs, delivery." };

export default function Sell() {
  const { me } = useAuth();
  const nav = useNavigate();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ListingKind | "">("");
  const [queue, setQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [f, setF] = useState({ title: "", description: "", price: "", category: "", condition: "", hall_location: "", stock: "" });
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Meta>("/products/meta").then(setMeta).catch((e) => setErr(e.message)); }, []);

  // Picked photos are cropped/zoomed (and optionally enhanced) one at a time before upload.
  useEffect(() => {
    if (!queue[0]) { setCropSrc(""); return; }
    const url = URL.createObjectURL(queue[0]);
    setCropSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [queue]);
  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length);
    e.target.value = ""; setErr("");
    if (files.length) setQueue(files);
  };
  const uploadCropped = async (file: File) => {
    setBusy(true); setErr("");
    try { const url = await upload(file); setImages((x) => [...x, url].slice(0, 5)); setQueue((q) => q.slice(1)); }
    finally { setBusy(false); } // errors propagate so the crop dialog can show them
  };
  const chooseKind = (k: ListingKind) => {
    setKind(k);
    setF((c) => k === "service"
      ? { ...c, category: SERVICE_CATEGORY, condition: "", hall_location: "", stock: "" }
      : { ...c, category: c.category === SERVICE_CATEGORY ? "" : c.category });
  };
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setF((current) => ({ ...current, [k]: value }));
  };
  const isService = kind === "service";
  const steps = isService ? SERVICE_STEPS : PRODUCT_STEPS;
  const stepKey = steps[step];
  const isPreview = stepKey === "Preview";
  const productCategories = (meta?.categories ?? []).filter((c) => c !== SERVICE_CATEGORY);
  const publishable = !!kind && images.length > 0 && f.title.trim().length >= 3 && Number(f.price) > 0 &&
    !!f.category && (isService || (!!f.condition && !!f.hall_location && Number(f.stock) >= 1));
  const ok = stepKey === "Type"
    ? !!kind
    : stepKey === "Photos"
      ? images.length > 0
      : stepKey === "Details"
        ? f.title.trim().length >= 3 && Number(f.price) > 0 && !!f.category && (isService || (!!f.condition && Number(f.stock) >= 1))
        : isPreview ? publishable : !!f.hall_location;

  const publish = async () => {
    setBusy(true); setErr("");
    try { const r = await api<{ id: string }>("/products", { method: "POST", body: { ...f, condition: isService ? null : f.condition, hall_location: isService ? null : f.hall_location, stock: isService ? null : Number(f.stock), price: Number(f.price), image_urls: images, colors: isService ? [] : colors, sizes: isService ? [] : sizes } }); nav(`/products/${r.id}`); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  const fee = meta && me ? meta.fees[me.user_type] : null;
  if (me && !me.store_active) return <BusinessRequired />;
  return (
    <><div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-start justify-between gap-3"><h1 className="font-display text-2xl font-bold sm:text-3xl">Create a listing</h1><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[30%] bg-[#e6ebdf] font-display text-xl font-bold text-brand">{step + 1}</div></div>
      <div className="mb-4 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((title, index) => <div key={title} className="flex-1">
          <div className={`h-1.5 rounded-full transition-colors ${index <= step ? "bg-brand" : "bg-line"}`} />
          <p className={`mt-1.5 text-[10px] font-medium ${index === step ? "text-brand" : "text-ink/45"}`}>{title}</p>
        </div>)}
      </div>
      <div className="card space-y-5 rounded-2xl p-4 sm:p-6">
        {stepKey === "Type" && (<fieldset>
          <legend className="mb-3 text-sm font-semibold">What are you listing?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["product", "service"] as ListingKind[]).map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => chooseKind(k)}
              className={`rounded-2xl border p-4 text-left transition ${kind === k ? "border-brand bg-[#e6ebdf] ring-1 ring-brand" : "border-line bg-white hover:bg-paper"}`}>
              <span className={`mb-3 grid h-11 w-11 place-items-center rounded-[30%] ${kind === k ? "bg-brand text-white" : "bg-[#e6ebdf] text-brand"}`}><KindIcon kind={k} size={22} /></span>
              <span className="block font-display text-lg font-bold">{KIND_LABEL[k]}</span>
              <span className="mt-1 block text-xs leading-5 text-ink/60">{KIND_COPY[k]}</span>
            </button>)}
          </div>
        </fieldset>)}
        {stepKey === "Photos" && (<>
          <div className="grid grid-cols-3 gap-2">
            {images.map((u) => (
              <div key={u} className="relative aspect-square overflow-hidden rounded-md border border-line">
                <img src={mediaUrl(u)} alt="" className="h-full w-full bg-[#ebe9e2] object-cover" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
                <button aria-label="Remove photo" className="absolute right-1 top-1 rounded bg-white p-0.5 shadow" onClick={() => setImages(images.filter((x) => x !== u))}><X size={14} /></button>
              </div>))}
{images.length < 5 && <PhotoTiles onChange={addFiles} busy={busy} />}
          </div>
          <p className="text-xs text-ink/60">Up to 5 photos. You can crop, zoom and apply Free AI Enhance to each one. Your first photo is the cover.</p>
        </>)}
        {stepKey === "Details" && meta && (<>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e6ebdf] px-3 py-1 text-xs font-semibold text-brand"><KindIcon kind={kind || "product"} size={13} />{KIND_LABEL[kind || "product"]} listing</p>
          <input className="input" placeholder={isService ? "Service name, e.g. Laptop repair & setup" : "Title, e.g. Engineering Mathematics 3 Textbook"} value={f.title} onChange={set("title")} maxLength={120} />
          <textarea className="input min-h-24" placeholder={isService ? "Describe the service: what you offer, turnaround, how to book" : "Describe the item: edition, defects, what's included"} value={f.description} onChange={set("description")} maxLength={2000} />
          <input className="input" type="number" min="0" step="0.01" placeholder={isService ? "Starting price (GH₵)" : "Price (GH₵)"} value={f.price} onChange={set("price")} />
          {!isService && <select className="input" value={f.category} onChange={set("category")}><option value="">Category</option>{productCategories.map((c) => <option key={c}>{c}</option>)}</select>}
          {!isService && <select className="input" value={f.condition} onChange={set("condition")}><option value="">Condition</option>{meta.conditions.map((c) => <option key={c}>{c}</option>)}</select>}
          {!isService && <input className="input" type="number" min="1" step="1" placeholder="Units in stock (you can change this later)" value={f.stock} onChange={set("stock")} />}
          {!isService && <>
          <OptionChips label="Colours available" hint="Optional. Tap what you have, or skip." value={colors} onChange={setColors} suggestions={COLOR_SUGGESTIONS} />
          <OptionChips label="Sizes available" hint="Optional. Tap what you have, or skip." value={sizes} onChange={setSizes} suggestions={SIZE_SUGGESTIONS} />
          </>}
          {isService && fee && <FeePanel fee={fee} userType={me?.user_type} />}
        </>)}
        {stepKey === "Location & fees" && meta && (<>
          <LocationPicker value={f.hall_location} onChange={(v) => setF((c) => ({ ...c, hall_location: v }))} placeholder="Where is the item?" />
          {fee && <FeePanel fee={fee} userType={me?.user_type} />}
          <MeetupTip />
        </>)}
        {isPreview && meta && (<>
          <div>
            <p className="mb-2 text-sm font-semibold">Listing preview · tap a field to edit</p>
            <article className="product-card group mx-auto w-full max-w-sm overflow-hidden rounded-[1.25rem] border border-line bg-white shadow-sm">
              <div className="relative aspect-[4/4.3] overflow-hidden bg-[#ebe9e2]">
                {images[0] && <img src={mediaUrl(images[0])} alt={f.title || "Listing preview"} className="h-full w-full object-cover" />}
                {kind && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-brand"><KindIcon kind={kind} size={12} />{KIND_LABEL[kind]}</span>}
                <button type="button" onClick={() => setStep(1)} className="absolute bottom-3 right-3 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">Edit photos</button>
              </div>
              <div className="space-y-2 p-3 sm:p-3.5">
                <label className="block">
                  <span className="sr-only">Price in Ghana cedis</span>
                  <span className="flex items-center gap-1 font-display text-lg font-bold tracking-tight sm:text-xl">
                    <span>GH₵</span><input aria-label="Price in Ghana cedis" className="min-w-0 flex-1 border-b border-transparent bg-transparent outline-none focus:border-brand" type="number" min="0.01" step="0.01" value={f.price} onChange={set("price")} />
                  </span>
                </label>
                <input aria-label="Listing title" className="w-full border-b border-transparent bg-transparent text-[13px] leading-5 text-ink/80 outline-none focus:border-brand" value={f.title} onChange={set("title")} maxLength={120} />
                <select aria-label="Listing category" disabled={isService} className="w-full border-b border-transparent bg-transparent text-[11px] text-gold outline-none focus:border-brand" value={f.category} onChange={set("category")}>
                  {(isService ? [SERVICE_CATEGORY] : productCategories).map((category) => <option key={category}>{category}</option>)}
                </select>
                {!isService ? <div className="grid grid-cols-2 gap-2">
                  <select aria-label="Item condition" className="min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-ink/60 outline-none focus:border-brand" value={f.condition} onChange={set("condition")}><option value="">Condition</option>{meta.conditions.map((condition) => <option key={condition}>{condition}</option>)}</select>
                  <LocationPicker value={f.hall_location} onChange={(v) => setF((c) => ({ ...c, hall_location: v }))} placeholder="Location" selectClass="w-full min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-ink/60 outline-none focus:border-brand" />
                </div> : <p className="flex items-center gap-1 text-[11px] text-ink/50"><KindIcon kind="service" size={12} />Service</p>}
                {me && <SellerBadge type={me.user_type} />}
                <label className="block border-t border-line pt-2">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink/45">Description</span>
                  <textarea aria-label="Listing description" className="min-h-16 w-full resize-y rounded-lg border border-line bg-white px-2 py-1.5 text-xs leading-5 text-ink/70 outline-none focus:border-brand" value={f.description} onChange={set("description")} maxLength={2000} />
                </label>
              </div>
            </article>
          </div>
          {isService && fee && <FeePanel fee={fee} userType={me?.user_type} />}
        </>)}
        {err && <p className="text-sm text-red-700">{err}</p>}
        <div className="flex justify-between gap-3 border-t border-line pt-4">
          <button className="btn-ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</button>
          {!isPreview ? <button className="btn-primary" disabled={!ok || busy} onClick={() => setStep(step + 1)}>Next</button>
            : <button className="btn-primary" disabled={!ok || busy} onClick={publish}>{busy ? "Publishing…" : "Publish listing"}</button>}
        </div>
      </div>
    </div>
    {cropSrc && <ImageCropDialog key={cropSrc} src={cropSrc} title="product photo" aspect="product" enhanceable onCancel={() => setQueue((q) => q.slice(1))} onApply={uploadCropped} />}
    </>
  );
}

function BusinessRequired() {
  return <div className="card mx-auto max-w-xl rounded-2xl p-6 text-center">
    <h1 className="font-display text-2xl font-bold">Create your business first</h1>
    <p className="mt-2 text-sm text-ink/70">Vendors sell through a business storefront. It only takes a minute to set up.</p>
    <Link to="/store/create" className="btn-primary mt-5 inline-flex">Create my business</Link>
  </div>;
}

function FeePanel({ fee, userType }: { fee: { listing: number; promotion: number }; userType?: string }) {
  const business = userType !== undefined || true; // every seller now needs an active business
  return <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/5 p-4 text-sm">
    <BadgeCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
    <div>
      <p className="font-semibold">{business ? "Your business is active ✓" : "Selling as a verified student ✓"}</p>
      <p className="mt-0.5 text-ink/70">{fee.listing === 0 ? "Listing is free." : `Listing costs GH₵${fee.listing}.`} It goes live as soon as you publish.</p>
    </div>
  </div>;
}

function MeetupTip() {
  return <p className="flex items-start gap-2 text-xs leading-5 text-ink/60"><MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-gold" />Tip: arrange handovers at busy spots like the library or a hall entrance, in daylight.</p>;
}
