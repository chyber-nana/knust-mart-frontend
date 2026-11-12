import { useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "../api";

interface CampusAd {
  id: string;
  image_url: string;
  alt_text: string;
  link_url: string | null;
  expires_at: string;
}

export default function CampusAdCarousel() {
  const [ads, setAds] = useState<CampusAd[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    if (activeAds.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % activeAds.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeAds.length]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!activeAds.length) {
    return error ? <section aria-label="Ads"><h2 className="mb-2 font-display text-2xl font-bold">Ads</h2><p role="alert" className="text-sm text-red-700">{error}</p></section> : null;
  }

  const currentIndex = active % activeAds.length;
  const show = (index: number) => setActive((index + activeAds.length) % activeAds.length);
  const ad = activeAds[currentIndex];
  return (
    <section aria-label="Ads" className="animate-rise">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold tracking-[-.03em] sm:text-[1.7rem]">Ads</h2>
      </div>
      <div
        className="group relative aspect-square touch-pan-y overflow-hidden sm:aspect-[1.4/1] lg:aspect-[1.8/1]"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart === null) return;
          const delta = event.changedTouches[0].clientX - touchStart;
          if (Math.abs(delta) > 40) {
            show(currentIndex + (delta < 0 ? 1 : -1));
            suppressClick.current = true;
            window.setTimeout(() => { suppressClick.current = false; }, 0);
          }
          setTouchStart(null);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            event.currentTarget.setPointerCapture(event.pointerId);
            setTouchStart(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse" || touchStart === null) return;
          const delta = event.clientX - touchStart;
          if (Math.abs(delta) > 40) {
            show(currentIndex + (delta < 0 ? 1 : -1));
            suppressClick.current = true;
            window.setTimeout(() => { suppressClick.current = false; }, 0);
          }
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
          {ad.link_url
            ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer" aria-label={ad.alt_text} className="block h-full w-full"><img src={mediaUrl(ad.image_url)} alt={ad.alt_text} className="h-full w-full object-contain" /></a>
            : <img src={mediaUrl(ad.image_url)} alt={ad.alt_text} className="h-full w-full object-contain" />}
        </div>
      </div>
      {activeAds.length > 1 && <div className="mt-3 flex justify-center gap-1.5">
        {activeAds.map((item, index) => <button
          key={item.id}
          type="button"
          aria-label={`Show flyer ${index + 1}`}
          aria-current={index === currentIndex}
          onClick={() => show(index)}
          className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-7 bg-brand" : "w-1.5 bg-line hover:bg-brand/50"}`}
        />)}
      </div>}
    </section>
  );
}
