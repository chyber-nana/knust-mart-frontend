import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ImagePlus, Trash2 } from "lucide-react";

const DURATION_LABEL: Record<"day" | "week" | "month", string> = { day: "1 day", week: "1 week", month: "1 month" };
import { api, apiForm, mediaUrl } from "../api";
import { useAuth } from "../auth";

interface CampusAd {
  id: string;
  image_url: string;
  alt_text: string;
  link_url: string | null;
  duration: "day" | "week" | "month";
  created_at: string;
  expires_at: string;
}

export default function AdminAds() {
  const { me } = useAuth();
  const [ads, setAds] = useState<CampusAd[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [duration, setDuration] = useState<CampusAd["duration"]>("day");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setAds(await api<CampusAd[]>("/ads/admin"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (me?.is_admin) void load();
  }, [me?.is_admin]);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const addFlyer = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a flyer image first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("alt_text", altText.trim());
      form.append("duration", duration);
      if (linkUrl.trim()) form.append("link_url", linkUrl.trim());
      await apiForm<CampusAd>("/ads/admin", form);
      setFile(null);
      setAltText("");
      setLinkUrl("");
      setDuration("day");
      const picker = document.getElementById("flyer-file") as HTMLInputElement | null;
      if (picker) picker.value = "";
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeFlyer = async (ad: CampusAd) => {
    if (!window.confirm("Remove this flyer from the carousel?")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/ads/admin/${ad.id}`, { method: "DELETE" });
      setAds((current) => current.filter((item) => item.id !== ad.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!me?.is_admin) return <Navigate to="/" replace />;
  const nowMs = Date.now();
  const liveAds = ads.filter((ad) => Date.parse(ad.expires_at) > nowMs);
  const expiredAds = ads.filter((ad) => Date.parse(ad.expires_at) <= nowMs);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Campus flyers</h1>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={addFlyer} className="card space-y-4 p-4 sm:p-6">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Flyer image</span>
          <span className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line bg-paper px-4 py-3 text-sm font-semibold transition hover:border-brand/50 hover:bg-brand/5">
            <ImagePlus size={18} />{file?.name ?? "Choose JPG, PNG or WebP"}
            <input id="flyer-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Alt text</span>
          <input className="input" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={160} placeholder="Describe the flyer for screen readers" required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Ad duration</span>
          <select className="input" value={duration} onChange={(event) => setDuration(event.target.value as CampusAd["duration"])}>
            <option value="day">{DURATION_LABEL.day}</option>
            <option value="week">{DURATION_LABEL.week}</option>
            <option value="month">{DURATION_LABEL.month}</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Link (optional)</span>
          <input className="input" type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} maxLength={2048} placeholder="https://" />
        </label>
        <p className="text-xs text-ink/55">Flyer images must be under 3 MB.</p>
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Uploading…" : "Add flyer"}</button>
      </form>

      <FlyerList title="Current flyers" empty="No live flyers right now." ads={liveAds} busy={busy} onRemove={removeFlyer} />
      {expiredAds.length > 0 && <FlyerList title="Expired" ads={expiredAds} busy={busy} onRemove={removeFlyer} expired />}
    </div>
  );
}

function FlyerList({ title, ads, empty, busy, onRemove, expired = false }: { title: string; ads: CampusAd[]; empty?: string; busy: boolean; onRemove: (ad: CampusAd) => void; expired?: boolean }) {
  return (
      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
        {ads.length === 0 ? <p className="card p-5 text-sm text-ink/60">{empty ?? "Nothing here."}</p> : <ul className="space-y-3">
          {ads.map((ad) => <li key={ad.id} className={`card flex items-center gap-3 p-3 sm:gap-4 sm:p-4 ${expired ? "opacity-70" : ""}`}>
            <img src={mediaUrl(ad.image_url)} alt={ad.alt_text} className="h-16 w-24 shrink-0 rounded-lg bg-paper object-contain sm:h-20 sm:w-32" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{ad.alt_text}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/55">
                {expired && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">Expired</span>}
                <span>{DURATION_LABEL[ad.duration] ?? ad.duration} · {expired ? "ended" : "expires"} {new Date(ad.expires_at).toLocaleDateString()}</span>
              </p>
              {ad.link_url && <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-brand underline">{ad.link_url}</a>}
            </div>
            <button type="button" aria-label="Remove flyer" onClick={() => onRemove(ad)} disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-red-700 transition hover:bg-red-50">
              <Trash2 size={17} />
            </button>
          </li>)}
        </ul>}
      </section>
  );
}
