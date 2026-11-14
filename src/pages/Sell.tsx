import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { api, Meta, mediaUrl, upload } from "../api";
import { useAuth } from "../auth";
import SellerBadge from "../components/SellerBadge";

const ITEM_STEPS = ["Photos", "Details", "Location & fees", "Preview"];

export default function Sell() {
  const { me } = useAuth();
  const nav = useNavigate();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [f, setF] = useState({ title: "", description: "", price: "", category: "", condition: "", hall_location: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Meta>("/products/meta").then(setMeta).catch((e) => setErr(e.message)); }, []);

  const addFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length);
    setBusy(true); setErr("");
    try { const urls: string[] = []; for (const file of files) urls.push(await upload(file)); setImages((x) => [...x, ...urls]); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); e.target.value = ""; }
  };
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (k === "category") {
      setF((current) => ({ ...current, category: value, ...(value === "Services" ? { condition: "", hall_location: "" } : {}) }));
      if (step === ITEM_STEPS.length - 1 && value === "Services") setStep(ITEM_STEPS.length - 2);
      return;
    }
    setF((current) => ({ ...current, [k]: value }));
  };
  const isService = f.category === "Services";
  const steps = isService ? ["Photos", "Details", "Preview"] : ITEM_STEPS;
  const isPreview = step === steps.length - 1;
  const publishable = images.length > 0 && f.title.trim().length >= 3 && Number(f.price) > 0 &&
    !!f.category && (isService || (!!f.condition && !!f.hall_location));
  const ok = step === 0
    ? images.length > 0
    : step === 1
      ? f.title.trim().length >= 3 && Number(f.price) > 0 && !!f.category && (isService || !!f.condition)
      : isPreview ? publishable : !!f.hall_location;

  const publish = async () => {
    setBusy(true); setErr("");
    try { const r = await api<{ id: string }>("/products", { method: "POST", body: { ...f, condition: isService ? null : f.condition, hall_location: isService ? null : f.hall_location, price: Number(f.price), image_urls: images } }); nav(`/products/${r.id}`); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  const fee = meta && me ? meta.fees[me.user_type] : null;
  if (me && me.user_type === "external" && !me.store_active) return <BusinessRequired />;
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-start justify-between gap-3"><h1 className="font-display text-2xl font-bold sm:text-3xl">Create a listing</h1><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[30%] bg-[#e6ebdf] font-display text-xl font-bold text-brand">{step + 1}</div></div>
      <div className="mb-4 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((title, index) => <div key={title} className="flex-1">
          <div className={`h-1.5 rounded-full transition-colors ${index <= step ? "bg-brand" : "bg-line"}`} />
          <p className={`mt-1.5 text-[10px] font-medium ${index === step ? "text-brand" : "text-ink/45"}`}>{title}</p>
        </div>)}
      </div>
      <div className="card space-y-5 rounded-2xl p-4 sm:p-6">
        {step === 0 && (<>
          <div className="grid grid-cols-3 gap-2">
            {images.map((u) => (
              <div key={u} className="relative aspect-square overflow-hidden rounded-md border border-line">
                <img src={mediaUrl(u)} alt="" className="h-full w-full object-cover" />
                <button aria-label="Remove photo" className="absolute right-1 top-1 rounded bg-white p-0.5 shadow" onClick={() => setImages(images.filter((x) => x !== u))}><X size={14} /></button>
              </div>))}
            {images.length < 5 && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-ink/30 text-xs text-ink/60 hover:bg-paper">
                <span className="flex flex-col items-center gap-1"><ImagePlus size={20} />{busy ? "Uploading…" : "Add photo"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addFiles} disabled={busy} />
              </label>)}
          </div>
          <p className="text-xs text-ink/60">Up to 5 photos, 3 MB each. Your first photo is the cover.</p>
        </>)}
        {step === 1 && meta && (<>
          <input className="input" placeholder="Title, e.g. Engineering Mathematics 3 Textbook" value={f.title} onChange={set("title")} maxLength={120} />
          <textarea className="input min-h-24" placeholder="Describe the item: edition, defects, what's included" value={f.description} onChange={set("description")} maxLength={2000} />
          <input className="input" type="number" min="0" step="0.01" placeholder="Price (GH₵)" value={f.price} onChange={set("price")} />
          <select className="input" value={f.category} onChange={set("category")}><option value="">Category</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
          {!isService && <select className="input" value={f.condition} onChange={set("condition")}><option value="">Condition</option>{meta.conditions.map((c) => <option key={c}>{c}</option>)}</select>}
          {isService && fee && <FeePanel fee={fee} userType={me?.user_type} />}
        </>)}
        {step === 2 && !isPreview && meta && !isService && (<>
          <select className="input" value={f.hall_location} onChange={set("hall_location")}><option value="">Where is the item?</option>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select>
          {fee && <FeePanel fee={fee} userType={me?.user_type} />}
        </>)}
        {isPreview && meta && (<>
          <div>
            <p className="mb-2 text-sm font-semibold">Listing preview · tap a field to edit</p>
            <article className="product-card group mx-auto w-full max-w-sm overflow-hidden rounded-[1.25rem] border border-line bg-white shadow-sm">
              <div className="relative aspect-[4/4.3] overflow-hidden bg-[#ebe9e2]">
                {images[0] && <img src={mediaUrl(images[0])} alt={f.title || "Listing preview"} className="h-full w-full object-cover" />}
                <button type="button" onClick={() => setStep(0)} className="absolute bottom-3 right-3 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">Edit photos</button>
              </div>
              <div className="space-y-2 p-3 sm:p-3.5">
                <label className="block">
                  <span className="sr-only">Price in Ghana cedis</span>
                  <span className="flex items-center gap-1 font-display text-lg font-bold tracking-tight sm:text-xl">
                    <span>GH₵</span><input aria-label="Price in Ghana cedis" className="min-w-0 flex-1 border-b border-transparent bg-transparent outline-none focus:border-brand" type="number" min="0.01" step="0.01" value={f.price} onChange={set("price")} />
                  </span>
                </label>
                <input aria-label="Listing title" className="w-full border-b border-transparent bg-transparent text-[13px] leading-5 text-ink/80 outline-none focus:border-brand" value={f.title} onChange={set("title")} maxLength={120} />
                <select aria-label="Listing category" className="w-full border-b border-transparent bg-transparent text-[11px] text-gold outline-none focus:border-brand" value={f.category} onChange={set("category")}>
                  {meta.categories.map((category) => <option key={category}>{category}</option>)}
                </select>
                {!isService ? <div className="grid grid-cols-2 gap-2">
                  <select aria-label="Item condition" className="min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-ink/60 outline-none focus:border-brand" value={f.condition} onChange={set("condition")}><option value="">Condition</option>{meta.conditions.map((condition) => <option key={condition}>{condition}</option>)}</select>
                  <select aria-label="Item location" className="min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-ink/60 outline-none focus:border-brand" value={f.hall_location} onChange={set("hall_location")}><option value="">Location</option>{meta.locations.map((location) => <option key={location}>{location}</option>)}</select>
                </div> : <p className="text-[11px] text-ink/50">Service</p>}
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
  return <div className="rounded-xl border border-line bg-paper p-4 text-sm">
    <p className="mb-1 font-semibold">{userType === "student" ? "Student seller rates" : "External vendor rates"}</p>
    <p>Listing: {fee.listing === 0 ? "Free" : `GH₵${fee.listing} per listing`}</p>
    <p>Promotion: GH₵{fee.promotion}</p>
    <p className="mt-1 text-xs text-ink/60">Promotion billing isn't connected yet. Nothing is charged here.</p>
  </div>;
}
