import OptionChips, { COLOR_SUGGESTIONS, SIZE_SUGGESTIONS } from "../components/OptionChips";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Meta, mediaUrl, upload } from "../api";
import LocationPicker from "../components/LocationPicker";
import PhotoTiles from "../components/PhotoTiles";

interface ProductData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string | null;
  hall_location: string | null;
  stock: number | null;
  colors?: string[];
  sizes?: string[];
  images: string[];
}

export default function ProductEdit() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "", condition: "", hall_location: "", stock: "" });
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isService = form.category === "Services";

  useEffect(() => {
    Promise.all([api<ProductData>(`/products/${id}`), api<Meta>("/products/meta")])
      .then(([product, details]) => {
        setMeta(details);
        setImages(product.images);
        setColors(product.colors ?? []);
        setSizes(product.sizes ?? []);
        setForm({
          title: product.title,
          description: product.description ?? "",
          price: String(product.price),
          category: product.category,
          condition: product.condition ?? "",
          hall_location: product.hall_location ?? "",
          stock: product.stock == null ? "" : String(product.stock),
        });
      })
      .catch((x) => setErr((x as Error).message));
  }, [id]);

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((current) => key === "category" && value === "Services"
      ? { ...current, category: value, condition: "", hall_location: "", stock: "" }
      : { ...current, [key]: value });
  };
  const addPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length);
    setBusy(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await upload(file));
      setImages((current) => [...current, ...urls]);
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); e.target.value = ""; }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api(`/products/${id}`, {
        method: "PATCH",
        body: { ...form, condition: isService ? null : form.condition, hall_location: isService ? null : form.hall_location, stock: isService ? null : Number(form.stock), price: Number(form.price), image_urls: images, colors: isService ? [] : colors, sizes: isService ? [] : sizes },
      });
      nav(`/products/${id}`);
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-2xl font-bold">Edit listing</h1>
      <div className="card space-y-3 p-5">
        <input className="input" placeholder="Title" value={form.title} onChange={set("title")} minLength={3} maxLength={120} required />
        <textarea className="input min-h-24" placeholder="Description" value={form.description} onChange={set("description")} maxLength={2000} />
        <input className="input" type="number" min="0.01" step="0.01" placeholder="Price (GH₵)" value={form.price} onChange={set("price")} required />
        <select className="input" value={form.category} onChange={set("category")} required>{meta?.categories.map((category) => <option key={category}>{category}</option>)}</select>
        {!isService && <>
          <label className="block text-sm font-semibold">Units in stock
            <input className="input mt-1 font-normal" type="number" min="0" step="1" value={form.stock} onChange={set("stock")} required />
            <span className="text-xs font-normal text-ink/55">Units still available to order. Update this whenever you restock. At 0 the listing closes.</span>
          </label>
          <select className="input" value={form.condition} onChange={set("condition")} required><option value="">Condition</option>{meta?.conditions.map((condition) => <option key={condition}>{condition}</option>)}</select>
          <OptionChips label="Colours available" hint="Optional." value={colors} onChange={setColors} suggestions={COLOR_SUGGESTIONS} />
          <OptionChips label="Sizes available" hint="Optional." value={sizes} onChange={setSizes} suggestions={SIZE_SUGGESTIONS} />
          <LocationPicker required value={form.hall_location} onChange={(v) => setForm((c) => ({ ...c, hall_location: v }))} placeholder="Item location" />
        </>}
        <div>
          <p className="mb-2 text-sm font-semibold">Listing photos</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url) => <div key={url} className="relative aspect-square overflow-hidden rounded border border-line">
              <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
              <button type="button" className="absolute right-1 top-1 rounded bg-white px-2 py-1 text-xs shadow" onClick={() => setImages(images.filter((item) => item !== url))}>Remove</button>
            </div>)}
            {images.length < 5 && <PhotoTiles onChange={addPhoto} busy={busy} />}
          </div>
          {images.length === 0 && <p className="mt-1 text-xs text-red-700">Keep at least one photo on the listing.</p>}
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy || images.length === 0}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}
