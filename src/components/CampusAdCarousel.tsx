import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api, mediaUrl } from "../api";

interface CampusAd {
  id: string;
  image_url: string;
  alt_text: string;
  link_url: string | null;
}

export default function CampusAdCarousel() {
  const [ads, setAds] = useState<CampusAd[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<CampusAd[]>("/ads")
      .then(setAds)
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (paused || ads.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % ads.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [ads.length, paused]);

  if (!ads.length) {
    return error ? <section aria-label="Around KNUST"><h2 className="mb-2 font-display text-2xl font-bold">Around KNUST</h2><p role="alert" className="text-sm text-red-700">{error}</p></section> : null;
  }

  const show = (index: number) => setActive((index + ads.length) % ads.length);
  const ad = ads[active];
  const image = <img
    src={mediaUrl(ad.image_url)}
    alt={ad.alt_text}
    className="h-full w-full object-contain transition duration-500"
  />;

  return (
    <section
      aria-label="Around KNUST"
      className="animate-rise"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold tracking-[-.03em] sm:text-[1.7rem]">Around KNUST</h2>
        {ads.length > 1 && <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Previous flyer" onClick={() => show(active - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white transition hover:-translate-x-0.5 hover:bg-paper"><ArrowLeft size={16} /></button>
          <span className="min-w-10 text-center text-xs font-semibold tabular-nums text-ink/55">{active + 1} / {ads.length}</span>
          <button type="button" aria-label="Next flyer" onClick={() => show(active + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white transition hover:translate-x-0.5 hover:bg-paper"><ArrowRight size={16} /></button>
        </div>}
      </div>
      <div className="ad-frame group relative aspect-[2.2/1] overflow-hidden rounded-[1.4rem] border border-line sm:aspect-[3.4/1]">
        {ad.link_url
          ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer" aria-label={ad.alt_text} className="block h-full w-full">{image}</a>
          : <div className="h-full w-full">{image}</div>}
      </div>
      {ads.length > 1 && <div className="mt-3 flex justify-center gap-1.5">
        {ads.map((item, index) => <button
          key={item.id}
          type="button"
          aria-label={`Show flyer ${index + 1}`}
          aria-current={index === active}
          onClick={() => show(index)}
          className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-7 bg-brand" : "w-1.5 bg-line hover:bg-brand/50"}`}
        />)}
      </div>}
    </section>
  );
}
