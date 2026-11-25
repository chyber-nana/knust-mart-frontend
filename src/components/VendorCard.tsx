import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, MapPin, Palette, Star } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { mediaUrl } from "../api";
import { BADGE_BY_KEY, BadgeIcon } from "./badgeCatalog";
import { DefaultLogo } from "./DefaultVisuals";
import UserBadges from "./UserBadges";

const badgeLabel = (b: string) => BADGE_BY_KEY[b]?.label ?? (b.startsWith("custom:") ? b.slice(7) : b);

/** Load an image for canvas export. CORS is required for remote logos so the canvas stays untainted. */
const loadImage = (src: string, useCors = true): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) img.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      img.src = "";
      reject(new Error("Image took too long to load."));
    }, 15000);
    img.onload = () => {
      window.clearTimeout(timer);
      if (img.naturalWidth === 0) reject(new Error("Image decoded with zero size."));
      else resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("The source image cannot be decoded."));
    };
    // Bust cache occasionally helps when a CDN/R2 response was incomplete.
    img.src = src.includes("?") ? `${src}&_t=${Date.now()}` : `${src}?_t=${Date.now()}`;
  });

const svgImage = async (markup: string): Promise<HTMLImageElement> => {
  const withNs = markup.includes("xmlns=")
    ? markup
    : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = URL.createObjectURL(new Blob([withNs], { type: "image/svg+xml;charset=utf-8" }));
  try {
    return await loadImage(url, false);
  } finally {
    URL.revokeObjectURL(url);
  }
};

interface P {
  id: string;
  name: string;
  logo_url: string | null;
  logo_position_x?: number;
  logo_position_y?: number;
  address: string | null;
  badges?: string[];
  rating: number | null;
  review_count: number;
}

const THEMES = {
  forest: { label: "Forest", primary: "#1f5d3a", pale: "#e6ebdf", text: "#1c1b17" },
  midnight: { label: "Midnight", primary: "#24324a", pale: "#e5eaf2", text: "#172033" },
  royal: { label: "Royal", primary: "#563b83", pale: "#eee8f8", text: "#281b3f" },
  sunset: { label: "Sunset", primary: "#a94f2c", pale: "#fae9df", text: "#402015" },
  monochrome: { label: "Monochrome", primary: "#303030", pale: "#ededed", text: "#171717" },
} as const;

export default function VendorCard({ v }: { v: P }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [theme, setTheme] = useState<keyof typeof THEMES>("forest");
  const [showBadges, setShowBadges] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const colors = THEMES[theme];

  const download = async () => {
    setBusy(true);
    setErr("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser couldn't create the vendor card image.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = colors.pale;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, 0, canvas.width, 22);

      // Logo — prefer real logo; on any decode/CORS failure use the default mark so export still succeeds.
      let logoDrawn = false;
      if (v.logo_url) {
        try {
          const logo = await loadImage(mediaUrl(v.logo_url), true);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(72, 94, 210, 210, 24);
          ctx.clip();
          const scale = Math.max(210 / logo.naturalWidth, 210 / logo.naturalHeight);
          const sourceWidth = 210 / scale;
          const sourceHeight = 210 / scale;
          const sourceX = (logo.naturalWidth - sourceWidth) * (v.logo_position_x ?? 50) / 100;
          const sourceY = (logo.naturalHeight - sourceHeight) * (v.logo_position_y ?? 50) / 100;
          ctx.drawImage(logo, sourceX, sourceY, sourceWidth, sourceHeight, 72, 94, 210, 210);
          ctx.restore();
          logoDrawn = true;
        } catch {
          // fall through to default logo
        }
      }
      if (!logoDrawn) {
        const fallback = await svgImage(
          renderToStaticMarkup(<DefaultLogo />).replace("<svg", '<svg width="210" height="210"')
        );
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(72, 94, 210, 210, 24);
        ctx.clip();
        ctx.drawImage(fallback, 72, 94, 210, 210);
        ctx.restore();
      }

      ctx.textAlign = "left";
      ctx.fillStyle = colors.text;
      ctx.font = "bold 58px 'Bricolage Grotesque', sans-serif";
      ctx.fillText(v.name.slice(0, 28), 72, 390);
      if (showRating) {
        ctx.fillStyle = colors.primary;
        ctx.font = "bold 28px 'Instrument Sans', sans-serif";
        ctx.fillText(
          v.rating ? `Rating ${v.rating.toFixed(1)} / 5 (${v.review_count} reviews)` : "No reviews yet",
          72,
          448
        );
      }
      if (showLocation && v.address) {
        ctx.fillStyle = "#5b5a52";
        ctx.font = "28px 'Instrument Sans', sans-serif";
        ctx.fillText(v.address.slice(0, 42), 72, 502);
      }

      // Badge pills (single row, left column; overflow collapses to "+N").
      const badges = showBadges ? (v.badges ?? []) : [];
      if (badges.length) {
        ctx.font = "bold 22px 'Instrument Sans', sans-serif";
        ctx.textAlign = "left";
        const maxX = 780,
          y = 534,
          h = 46;
        let x = 72,
          shown = 0;
        for (const key of badges) {
          const label = badgeLabel(key).slice(0, 22);
          const w = 16 + 24 + 8 + ctx.measureText(label).width + 18;
          if (x + w > maxX - (shown < badges.length - 1 ? 70 : 0) && shown > 0) break;
          if (x + w > maxX) break;
          ctx.fillStyle = colors.pale;
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, h / 2);
          ctx.fill();
          try {
            const icon = await svgImage(
              renderToStaticMarkup(
                <BadgeIcon name={BADGE_BY_KEY[key] ? key : "custom"} size={24} />
              )
                .replace(/currentColor/g, colors.primary)
                .replace("<svg", '<svg width="24" height="24"')
            );
            ctx.drawImage(icon, x + 16, y + 11, 24, 24);
          } catch {
            // skip icon if SVG fails; still draw label
          }
          ctx.fillStyle = colors.primary;
          ctx.fillText(label, x + 48, y + 31);
          x += w + 10;
          shown++;
        }
        if (shown < badges.length) {
          ctx.fillStyle = "#5b5a52";
          ctx.fillText(`+${badges.length - shown}`, x + 4, y + 31);
        }
      }
      ctx.fillStyle = colors.primary;
      ctx.font = "bold 24px 'Instrument Sans', sans-serif";
      ctx.fillText("KNUST MARKET · VERIFIED STOREFRONT", 72, 635);

      // QR code — wait briefly if the ref SVG is not ready yet.
      let svg = qrRef.current?.querySelector("svg");
      if (!svg) {
        await new Promise((r) => setTimeout(r, 80));
        svg = qrRef.current?.querySelector("svg");
      }
      if (!svg) throw new Error("The storefront QR code isn't ready yet. Try again in a moment.");

      let svgMarkup = new XMLSerializer().serializeToString(svg);
      if (!svgMarkup.includes("xmlns=")) {
        svgMarkup = svgMarkup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const qrBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const qrUrl = URL.createObjectURL(qrBlob);
      try {
        const qrImage = await loadImage(qrUrl, false);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(830, 160, 290, 290);
        ctx.strokeStyle = colors.pale;
        ctx.lineWidth = 2;
        ctx.strokeRect(830, 160, 290, 290);
        ctx.drawImage(qrImage, 850, 180, 250, 250);
        ctx.fillStyle = "#1c1b17";
        ctx.textAlign = "center";
        ctx.font = "24px 'Instrument Sans', sans-serif";
        ctx.fillText("Scan to visit store", 975, 500);
      } finally {
        URL.revokeObjectURL(qrUrl);
      }

      const png = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("The vendor card could not be exported as PNG."));
        }, "image/png")
      );
      const fileUrl = URL.createObjectURL(png);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `${v.name.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "vendor"}-card.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (x) {
      const msg = (x as Error).message || "Could not create the card image.";
      // Friendlier message when the original logo is the problem (we already fall back, so this is rare).
      if (/cannot be decoded|Could not load image|timed out/i.test(msg)) {
        setErr("Could not load one of the images for the card. The download will use a default logo if needed — try again.");
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold">Customize your business card</h3>
          <p className="text-xs text-ink/55">Choose a look before downloading your shareable store card.</p>
        </div>
        <Palette size={19} className="text-ink/45" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => setTheme(key)}
            className={`rounded-xl border p-2 text-left text-xs font-semibold ${theme === key ? "border-brand ring-2 ring-brand/20" : "border-line"}`}
          >
            <span className="mb-1 flex h-7 overflow-hidden rounded-md">
              <i className="flex-1" style={{ background: THEMES[key].primary }} />
              <i className="flex-1" style={{ background: THEMES[key].pale }} />
            </span>
            {THEMES[key].label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showRating} onChange={(e) => setShowRating(e.target.checked)} />
          Show rating
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showLocation} onChange={(e) => setShowLocation(e.target.checked)} />
          Show location
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showBadges} onChange={(e) => setShowBadges(e.target.checked)} />
          Show awards
        </label>
      </div>
      <div className="rounded-xl border p-3" style={{ borderColor: colors.pale, background: "#fff" }}>
        <div className="mb-2 h-2 rounded-full" style={{ background: colors.primary }} />
        <div className="flex items-center gap-4">
          {v.logo_url ? (
            <img
              crossOrigin="anonymous"
              src={mediaUrl(v.logo_url)}
              alt=""
              style={{ objectPosition: `${v.logo_position_x ?? 50}% ${v.logo_position_y ?? 50}%` }}
              className="h-16 w-16 rounded-[30%] border border-line object-cover"
            />
          ) : (
            <div className="h-16 w-16 overflow-hidden rounded-[30%] border border-line">
              <DefaultLogo />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold" style={{ color: colors.text }}>
              {v.name}
            </p>
            {showRating && (
              <p className="flex items-center gap-1 text-xs text-ink/70">
                <Star size={12} />
                {v.rating ? `${v.rating.toFixed(1)} (${v.review_count})` : "No reviews yet"}
              </p>
            )}
            {showLocation && v.address && (
              <p className="flex items-center gap-1 text-xs text-ink/70">
                <MapPin size={12} />
                {v.address}
              </p>
            )}
            {showBadges && <UserBadges badges={v.badges ?? []} />}
          </div>
          <div ref={qrRef}>
            <QRCodeSVG value={`${window.location.origin}/vendors/${v.id}`} size={72} />
          </div>
        </div>
      </div>
      <button className="btn-ghost w-full" disabled={busy} onClick={download}>
        <Download size={15} />
        {busy ? "Preparing PNG…" : "Download card as PNG"}
      </button>
      {err && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}
