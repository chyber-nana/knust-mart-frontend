import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, mediaUrl } from "../api";

interface CampusAd {
  id: string;
  image_url: string;
  alt_text: string;
  link_url: string | null;
  expires_at: string;
}

const SLIDE_MS = 5000;

export default function CampusAdCarousel() {
  const [ads, setAds] = useState<CampusAd[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const loadAds = () => {
      api<CampusAd[]>("/ads")
        .then(setAds)
        .catch((e) => setError((e as Error).message));
    };
    loadAds();
    const refresh = window.setInterval(loadAds, 60_000);
    return () => window.clearInterval(refresh);
  }, []);

  const activeAds = ads.filter((ad) => Date.parse(ad.expires_at) > now);
  const count = activeAds.length;
  const currentIndex = count ? active % count : 0;

  // One timer per slide so the progress bar and the advance stay in sync.
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [count, currentIndex, paused]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!count) {
    return error ? <section aria-label="Campus flyers"><h2 className="mb-2 font-display text-xl font-bold">Campus flyers</h2><p role="alert" className="text-sm text-red-700">{error}</p></section> : null;
  }

  const show = (index: number) => setActive((index + count) % count);
  const ad = activeAds[currentIndex];
  const swipe = (delta: number) => {
    if (Math.abs(delta) <= 40) return;
    show(currentIndex + (delta < 0 ? 1 : -1));
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  };
  const image = <img src={mediaUrl(ad.image_url)} alt={ad.alt_text} className="relative h-full w-full object-contain" />;
  return (
    <section aria-label="Campus flyers" className="animate-rise">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-[-.03em] sm:text-2xl">Campus flyers</h2>
        {count > 1 && <span className="text-xs font-semibold text-ink/50" aria-live="polite">{currentIndex + 1} / {count}<span className="ml-2 hidden text-ink/40 min-[420px]:inline">· swipe for more</span></span>}
      </div>
      <div
        className="group relative aspect-video max-h-[22rem] touch-pan-y overflow-hidden rounded-[1.25rem] border border-line bg-[var(--surface-soft)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(event) => { setPaused(true); setTouchStart(event.touches[0]?.clientX ?? null); }}
        onTouchEnd={(event) => {
          if (touchStart !== null) swipe(event.changedTouches[0].clientX - touchStart);
          setTouchStart(null);
          setPaused(false);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            event.currentTarget.setPointerCapture(event.pointerId);
            setTouchStart(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse" || touchStart === null) return;
          swipe(event.clientX - touchStart);
          setTouchStart(null);
        }}
        onPointerCancel={() => setTouchStart(null)}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div key={ad.id} className="ad-slide absolute inset-0">
          {/* Blurred copy fills the sides so tall flyers never leave empty bars */}
          <img src={mediaUrl(ad.image_url)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
          {ad.link_url
            ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer" aria-label={ad.alt_text} className="relative block h-full w-full">{image}</a>
            : image}
        </div>
        {count > 1 && <>
          <button type="button" aria-label="Previous flyer" onClick={() => show(currentIndex - 1)} className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 md:group-hover:grid"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next flyer" onClick={() => show(currentIndex + 1)} className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 md:group-hover:grid"><ChevronRight size={18} /></button>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/15" aria-hidden="true">
            <div key={`${ad.id}-${currentIndex}`} className="ad-progress h-full bg-brand" style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }} />
          </div>
        </>}
      </div>
      {count > 1 && <div className="mt-3 flex justify-center gap-1.5">
        {activeAds.map((item, index) => <button
          key={item.id}
          type="button"
          aria-label={`Show flyer ${index + 1}`}
          aria-current={index === currentIndex}
          onClick={() => show(index)}
          className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-7 bg-brand" : "w-1.5 bg-ink/20 hover:bg-brand/50"}`}
        />)}
      </div>}
    </section>
  );
}
