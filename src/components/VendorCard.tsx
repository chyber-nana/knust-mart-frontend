import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, MapPin, Star } from "lucide-react";
import { mediaUrl } from "../api";

interface P { id: string; name: string; logo_url: string | null; logo_position_x?: number; logo_position_y?: number; address: string | null; rating: number | null; review_count: number }

export default function VendorCard({ v }: { v: P }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
      ctx.strokeStyle = "#ddd6c6";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = "#1f5d3a";
      ctx.fillRect(0, 0, canvas.width, 22);

      if (v.logo_url) {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = mediaUrl(v.logo_url);
        await logo.decode();
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
      } else {
        ctx.fillStyle = "#1f5d3a";
        ctx.beginPath();
        ctx.roundRect(72, 94, 210, 210, 24);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 120px 'Bricolage Grotesque', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(v.name.slice(0, 1).toUpperCase(), 177, 235);
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#1c1b17";
      ctx.font = "bold 58px 'Bricolage Grotesque', sans-serif";
      ctx.fillText(v.name.slice(0, 28), 72, 390);
      ctx.fillStyle = "#9a6b00";
      ctx.font = "bold 28px 'Instrument Sans', sans-serif";
      ctx.fillText(v.rating ? `Rating ${v.rating.toFixed(1)} / 5 (${v.review_count} reviews)` : "No reviews yet", 72, 448);
      ctx.fillStyle = "#5b5a52";
      ctx.font = "28px 'Instrument Sans', sans-serif";
      ctx.fillText(v.address?.slice(0, 42) || "KNUST campus marketplace", 72, 502);
      ctx.fillStyle = "#1f5d3a";
      ctx.font = "bold 24px 'Instrument Sans', sans-serif";
      ctx.fillText("KNUST MARKET · VERIFIED STOREFRONT", 72, 635);

      const svg = qrRef.current?.querySelector("svg");
      if (!svg) throw new Error("The storefront QR code isn't ready yet.");
      const qrBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
      const qrUrl = URL.createObjectURL(qrBlob);
      try {
        const qrImage = new Image();
        qrImage.src = qrUrl;
        await qrImage.decode();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(830, 160, 290, 290);
        ctx.strokeStyle = "#ddd6c6";
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

      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The vendor card could not be exported as PNG."));
      }, "image/png"));
      const fileUrl = URL.createObjectURL(png);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `${v.name.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "vendor"}-card.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-xl p-4">
      <div className="flex items-center gap-4">
      {v.logo_url ? <img crossOrigin="anonymous" src={mediaUrl(v.logo_url)} alt="" style={{ objectPosition: `${v.logo_position_x ?? 50}% ${v.logo_position_y ?? 50}%` }} className="h-16 w-16 rounded-[30%] border border-line object-cover" />
        : <div className="grid h-16 w-16 place-items-center rounded-[30%] bg-brand font-display text-2xl font-bold text-white">{v.name[0]}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-bold">{v.name}</p>
        <p className="flex items-center gap-1 text-xs text-ink/70"><Star size={12} />{v.rating ? `${v.rating.toFixed(1)} (${v.review_count})` : "No reviews yet"}</p>
        {v.address && <p className="flex items-center gap-1 text-xs text-ink/70"><MapPin size={12} />{v.address}</p>}
      </div>
      <div ref={qrRef}><QRCodeSVG value={`${window.location.origin}/vendors/${v.id}`} size={72} /></div>
      </div>
      <button className="btn-ghost mt-4 w-full" disabled={busy} onClick={download}><Download size={15} />{busy ? "Preparing PNG…" : "Download card as PNG"}</button>
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  );
}
