import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, mediaUrl, upload } from "../api";
import { useAuth } from "../auth";

export default function EditStore() {
  const { me } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ store_name: "", store_bio: "", hostel_or_business_address: "", logo_url: "", banner_url: "", banner_position_y: 50 });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!me) return;
    api<{ name: string; bio: string | null; address: string | null; logo_url: string | null; banner_url: string | null; banner_position_y: number }>(`/vendors/${me.id}`)
      .then((v) => setF({ store_name: v.name, store_bio: v.bio ?? "", hostel_or_business_address: v.address ?? "", logo_url: v.logo_url ?? "", banner_url: v.banner_url ?? "", banner_position_y: v.banner_position_y ?? 50 }))
      .catch((e) => setErr(e.message));
  }, [me]);
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const pick = (k: "logo_url" | "banner_url") => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setErr("");
    try { const url = await upload(file); setF((current) => ({ ...current, [k]: url })); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api("/vendors/me", { method: "PATCH", body: f }); nav(`/vendors/${me!.id}`); } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <form onSubmit={save} className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[30%] bg-brand text-white"><Store size={20} /></div><div><h1 className="font-display text-2xl font-bold">Your storefront</h1></div></div>
      <div className="card space-y-5 rounded-2xl p-4 sm:p-6">
        <div>
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Cover banner</p><span className="text-xs text-ink/50">Wide · 3:1</span></div>
          <div className="mb-3 aspect-[3/1] overflow-hidden rounded-xl border border-line bg-[#e6ebdf]">{f.banner_url && <img src={mediaUrl(f.banner_url)} alt="Store cover preview" style={{ objectPosition: `center ${f.banner_position_y}%` }} className="h-full w-full object-cover" />}</div>
          {f.banner_url && <label className="mb-3 block text-xs text-ink/60">Adjust visible area · {f.banner_position_y}%
            <input aria-label="Adjust banner vertical position" type="range" min="0" max="100" value={f.banner_position_y} onChange={(e) => setF({ ...f, banner_position_y: Number(e.target.value) })} className="mt-2 block w-full accent-brand" />
          </label>}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper"><ImagePlus size={15} />{busy ? "Uploading…" : "Change banner"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("banner_url")} className="hidden" disabled={busy} /></label>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Profile image</p>
          <div className="mb-3 grid h-24 w-24 place-items-center overflow-hidden rounded-[30%] border border-line bg-paper">{f.logo_url ? <img src={mediaUrl(f.logo_url)} alt="Store profile preview" className="h-full w-full object-cover" /> : <Store className="text-ink/30" size={28} />}</div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper"><ImagePlus size={15} />{busy ? "Uploading…" : "Change profile image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("logo_url")} className="hidden" disabled={busy} /></label>
        </div>
        <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Store name</span><input className="input" placeholder="e.g. Campus Tech Hub" value={f.store_name} onChange={set("store_name")} maxLength={80} /></label>
        <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Location</span><input className="input" placeholder="Hostel or business location" value={f.hostel_or_business_address} onChange={set("hostel_or_business_address")} maxLength={120} /></label>
        <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">About your store</span><textarea className="input min-h-28" placeholder="What can students find at your shop?" value={f.store_bio} onChange={set("store_bio")} maxLength={500} /></label>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full rounded-xl" disabled={busy}>{busy ? "Saving…" : "Save storefront"}</button>
      </div>
    </form>
  );
}
