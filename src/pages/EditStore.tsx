import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, mediaUrl, upload } from "../api";
import { useAuth } from "../auth";
import ImageCropDialog from "../components/ImageCropDialog";

interface StoreForm {
  store_name: string;
  store_bio: string;
  hostel_or_business_address: string;
  logo_url: string;
  logo_position_x: number;
  logo_position_y: number;
  banner_url: string;
  banner_position_x: number;
  banner_position_y: number;
}

type ImageKey = "logo" | "banner";

interface CropTarget {
  key: ImageKey;
  src: string;
}

const initialForm: StoreForm = {
  store_name: "",
  store_bio: "",
  hostel_or_business_address: "",
  logo_url: "",
  logo_position_x: 50,
  logo_position_y: 50,
  banner_url: "",
  banner_position_x: 50,
  banner_position_y: 50,
};

export default function EditStore() {
  const { me } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState(initialForm);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  useEffect(() => {
    if (!me) return;
    api<Partial<StoreForm> & { name: string; bio: string | null; address: string | null }>(`/vendors/${me.id}`)
      .then((v) => setF({
        ...initialForm,
        store_name: v.name,
        store_bio: v.bio ?? "",
        hostel_or_business_address: v.address ?? "",
        logo_url: v.logo_url ?? "",
        logo_position_x: v.logo_position_x ?? 50,
        logo_position_y: v.logo_position_y ?? 50,
        banner_url: v.banner_url ?? "",
        banner_position_x: v.banner_position_x ?? 50,
        banner_position_y: v.banner_position_y ?? 50,
      }))
      .catch((e) => setErr(e.message));
  }, [me]);

  const set = (key: "store_name" | "store_bio" | "hostel_or_business_address") =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setF((current) => ({ ...current, [key]: value }));
    };

  const pick = (key: ImageKey) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setErr("");
    try {
      const url = await upload(file);
      const imageField = key === "logo" ? "logo_url" : "banner_url";
      const xField = key === "logo" ? "logo_position_x" : "banner_position_x";
      const yField = key === "logo" ? "logo_position_y" : "banner_position_y";
      setF((current) => ({ ...current, [imageField]: url, [xField]: 50, [yField]: 50 }));
      setCropTarget({ key, src: url });
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const adjustCrop = (key: ImageKey) => {
    const src = key === "logo" ? f.logo_url : f.banner_url;
    if (src) setCropTarget({ key, src });
  };

  const applyCrop = ({ x, y }: { x: number; y: number }) => {
    if (!cropTarget) return;
    const xField = cropTarget.key === "logo" ? "logo_position_x" : "banner_position_x";
    const yField = cropTarget.key === "logo" ? "logo_position_y" : "banner_position_y";
    setF((current) => ({ ...current, [xField]: x, [yField]: y }));
    setCropTarget(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/vendors/me", { method: "PATCH", body: f });
      nav(`/vendors/${me!.id}`);
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  };

  const cropPosition = cropTarget?.key === "logo"
    ? { x: f.logo_position_x, y: f.logo_position_y }
    : { x: f.banner_position_x, y: f.banner_position_y };

  return (
    <>
      <form onSubmit={save} className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[30%] bg-brand text-white"><Store size={20} /></div><div><h1 className="font-display text-2xl font-bold">Your storefront</h1></div></div>
        <div className="card space-y-5 rounded-2xl p-4 sm:p-6">
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Cover banner</p><span className="text-xs text-ink/50">Wide · 3:1</span></div>
            <div className="mb-3 aspect-[3/1] overflow-hidden rounded-xl border border-line bg-[#e6ebdf]">
              {f.banner_url && <img src={mediaUrl(f.banner_url)} alt="Store cover preview" style={{ objectPosition: `${f.banner_position_x}% ${f.banner_position_y}%` }} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">
                <ImagePlus size={15} />{busy ? "Uploading…" : "Change banner"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("banner")} className="hidden" disabled={busy} />
              </label>
              {f.banner_url && <button type="button" onClick={() => adjustCrop("banner")} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">Adjust framing</button>}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Profile image</p>
            <div className="mb-3 grid h-24 w-24 place-items-center overflow-hidden rounded-[30%] border border-line bg-paper">
              {f.logo_url ? <img src={mediaUrl(f.logo_url)} alt="Store profile preview" style={{ objectPosition: `${f.logo_position_x}% ${f.logo_position_y}%` }} className="h-full w-full object-cover" /> : <Store className="text-ink/30" size={28} />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">
                <ImagePlus size={15} />{busy ? "Uploading…" : "Change profile image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("logo")} className="hidden" disabled={busy} />
              </label>
              {f.logo_url && <button type="button" onClick={() => adjustCrop("logo")} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">Adjust framing</button>}
            </div>
          </div>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Store name</span><input className="input" placeholder="e.g. Campus Tech Hub" value={f.store_name} onChange={set("store_name")} maxLength={80} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Location</span><input className="input" placeholder="Hostel or business location" value={f.hostel_or_business_address} onChange={set("hostel_or_business_address")} maxLength={120} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">About your store</span><textarea className="input min-h-28" placeholder="What can students find at your shop?" value={f.store_bio} onChange={set("store_bio")} maxLength={500} /></label>
          {err && <p className="text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl" disabled={busy || !!cropTarget}>{busy ? "Saving…" : "Save storefront"}</button>
        </div>
      </form>
      {cropTarget && (
        <ImageCropDialog
          src={mediaUrl(cropTarget.src)}
          title={cropTarget.key === "logo" ? "profile image" : "cover banner"}
          aspect={cropTarget.key === "logo" ? "square" : "banner"}
          position={cropPosition}
          onCancel={() => setCropTarget(null)}
          onApply={applyCrop}
        />
      )}
    </>
  );
}
