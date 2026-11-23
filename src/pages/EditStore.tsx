import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, mediaUrl, upload } from "../api";
import { useAuth } from "../auth";
import { DefaultBanner, DefaultLogo } from "../components/DefaultVisuals";
import ImageCropDialog from "../components/ImageCropDialog";
import LocationPicker from "../components/LocationPicker";

interface StoreForm {
  store_name: string;
  store_bio: string;
  hostel_or_business_address: string;
  phone_number: string;
  whatsapp_number: string;
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
  phone_number: "",
  whatsapp_number: "",
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
        phone_number: v.phone_number ?? "",
        whatsapp_number: v.whatsapp_number ?? "",
        logo_url: v.logo_url ?? "",
        logo_position_x: v.logo_position_x ?? 50,
        logo_position_y: v.logo_position_y ?? 50,
        banner_url: v.banner_url ?? "",
        banner_position_x: v.banner_position_x ?? 50,
        banner_position_y: v.banner_position_y ?? 50,
      }))
      .catch((e) => setErr(e.message));
  }, [me]);

  const set = (key: "store_name" | "store_bio" | "hostel_or_business_address" | "phone_number" | "whatsapp_number") =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setF((current) => ({ ...current, [key]: value }));
    };

  const pick = (key: ImageKey) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setCropTarget({ key, src: URL.createObjectURL(file) });
  };

  const closeCrop = () => {
    if (cropTarget) URL.revokeObjectURL(cropTarget.src);
    setCropTarget(null);
  };

  const applyCrop = async (file: File) => {
    if (!cropTarget) return;
    const key = cropTarget.key;
    setBusy(true);
    setErr("");
    try {
      const url = await upload(file);
      const imageField = key === "logo" ? "logo_url" : "banner_url";
      const xField = key === "logo" ? "logo_position_x" : "banner_position_x";
      const yField = key === "logo" ? "logo_position_y" : "banner_position_y";
      setF((current) => ({ ...current, [imageField]: url, [xField]: 50, [yField]: 50 }));
      closeCrop();
    } finally {
      setBusy(false); // errors propagate so the crop dialog can show them
    }
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

  return (
    <>
      <form onSubmit={save} className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[30%] bg-brand text-white"><Store size={20} /></div><div><h1 className="font-display text-2xl font-bold">Your storefront</h1></div></div>
        <div className="card space-y-5 rounded-2xl p-4 sm:p-6">
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Cover banner</p><span className="text-xs text-ink/50">Wide · 3:1</span></div>
            <div className="mb-3 aspect-[3/1] overflow-hidden rounded-xl border border-line bg-[#e6ebdf]">
              {f.banner_url ? <img src={mediaUrl(f.banner_url)} alt="Store cover preview" style={{ objectPosition: `${f.banner_position_x}% ${f.banner_position_y}%` }} className="h-full w-full object-cover" /> : <DefaultBanner />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">
                <ImagePlus size={15} />{busy ? "Uploading…" : f.banner_url ? "Change banner" : "Upload banner"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("banner")} className="hidden" disabled={busy} />
              </label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Profile image</p>
            <div className="mb-3 grid h-24 w-24 place-items-center overflow-hidden rounded-[30%] border border-line bg-paper">
              {f.logo_url ? <img src={mediaUrl(f.logo_url)} alt="Store profile preview" style={{ objectPosition: `${f.logo_position_x}% ${f.logo_position_y}%` }} className="h-full w-full object-cover" /> : <DefaultLogo />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-paper">
                <ImagePlus size={15} />{busy ? "Uploading…" : f.logo_url ? "Change profile image" : "Upload profile image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("logo")} className="hidden" disabled={busy} />
              </label>
            </div>
          </div>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Store name</span><input className="input" placeholder="e.g. Campus Tech Hub" value={f.store_name} onChange={set("store_name")} maxLength={80} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Location</span><LocationPicker value={f.hostel_or_business_address} onChange={(v) => setF((c) => ({ ...c, hostel_or_business_address: v }))} placeholder="Choose a hall or hostel" /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Phone number</span><input className="input" type="tel" autoComplete="tel" placeholder="+233…" value={f.phone_number} onChange={set("phone_number")} maxLength={32} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">WhatsApp number</span><input className="input" type="tel" placeholder="+233…" value={f.whatsapp_number} onChange={set("whatsapp_number")} maxLength={32} /><span className="text-xs text-ink/55">Include your country code so buyers can message you internationally.</span></label>
          <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">About your store</span><textarea className="input min-h-28" placeholder="What can students find at your shop?" value={f.store_bio} onChange={set("store_bio")} maxLength={500} /></label>
          {err && <p className="text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl" disabled={busy || !!cropTarget}>{busy ? "Saving…" : "Save storefront"}</button>
        </div>
      </form>
      {cropTarget && (
        <ImageCropDialog
          src={cropTarget.src}
          title={cropTarget.key === "logo" ? "profile image" : "cover banner"}
          aspect={cropTarget.key === "logo" ? "square" : "banner"}
          onCancel={closeCrop}
          onApply={applyCrop}
        />
      )}
    </>
  );
}
