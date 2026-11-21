import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
import { enhanceImage } from "../imageEnhance";

export type CropAspect = "square" | "banner" | "product";

// Output sizes keep uploads well under the 3 MB limit.
const OUTPUT: Record<CropAspect, [number, number]> = { square: [800, 800], banner: [1500, 500], product: [1000, 1075] };
const ASPECT_CLASS: Record<CropAspect, string> = { square: "aspect-square max-w-sm", banner: "aspect-[3/1]", product: "aspect-[4/4.3] max-w-sm" };
const MIN_ZOOM = 1, MAX_ZOOM = 4;

interface Props {
  src: string;
  title: string;
  aspect: CropAspect;
  /** Show the Free AI Enhance toggle (product photos). */
  enhanceable?: boolean;
  onCancel: () => void;
  /** Receives the cropped (and optionally enhanced) image as a JPEG file ready to upload. */
  onApply: (file: File) => void;
}

export default function ImageCropDialog({ src, title, aspect, enhanceable = false, onCancel, onApply }: Props) {
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // image-centre offset from stage centre, px
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const shown = useEnhanced && enhanced ? enhanced : src;

  // Clamp an offset so the image always covers the stage at a given zoom.
  const clampOff = (x: number, y: number, z: number) => {
    const stage = stageRef.current, img = imageRef.current;
    if (!stage || !img?.naturalWidth) return { x: 0, y: 0 };
    const b = stage.getBoundingClientRect();
    const s0 = Math.max(b.width / img.naturalWidth, b.height / img.naturalHeight);
    const mx = Math.max(0, (img.naturalWidth * s0 * z - b.width) / 2);
    const my = Math.max(0, (img.naturalHeight * s0 * z - b.height) / 2);
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };
  const changeZoom = (next: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    setZoom(z);
    setOff((o) => clampOff(o.x, o.y, z));
  };
  const reset = () => { setZoom(1); setOff({ x: 0, y: 0 }); };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); changeZoom(zoom - e.deltaY * 0.0025); };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  });

  const toggleEnhance = async () => {
    if (useEnhanced) { setUseEnhanced(false); return; }
    setErr("");
    if (enhanced) { setUseEnhanced(true); return; }
    setWorking(true);
    try { setEnhanced(await enhanceImage(src)); setUseEnhanced(true); }
    catch (x) { setErr((x as Error).message || "Could not enhance this photo."); }
    finally { setWorking(false); }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: off.x, y: off.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) setOff(clampOff(d.x + e.clientX - d.px, d.y + e.clientY - d.py, zoom));
  };
  const stop = () => { drag.current = null; };

  const apply = async () => {
    const stage = stageRef.current, img = imageRef.current;
    if (!stage || !img?.naturalWidth) return;
    setWorking(true); setErr("");
    try {
      const b = stage.getBoundingClientRect();
      const s = Math.max(b.width / img.naturalWidth, b.height / img.naturalHeight) * zoom;
      const left = b.width / 2 - (img.naturalWidth * s) / 2 + off.x;
      const top = b.height / 2 - (img.naturalHeight * s) / 2 + off.y;
      const [ow, oh] = OUTPUT[aspect];
      const canvas = document.createElement("canvas");
      canvas.width = ow; canvas.height = oh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser couldn't crop this image.");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, ow, oh);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, -left / s, -top / s, b.width / s, b.height / s, 0, 0, ow, oh);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      if (!blob) throw new Error("Could not export the cropped image.");
      onApply(new File([blob], `${crypto.randomUUID()}.jpg`, { type: "image/jpeg" }));
    } catch (x) { setErr((x as Error).message); setWorking(false); }
  };

  const btn = "grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-paper";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="crop-dialog-title" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="crop-dialog-title" className="font-display text-xl font-bold">Adjust {title.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-ink/60">Drag to reposition, use the slider or scroll to zoom.</p>
          </div>
          <button type="button" aria-label="Close crop dialog" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
        </div>

        <div ref={stageRef} className={`mx-auto max-h-[55vh] w-full touch-none cursor-grab overflow-hidden rounded-xl bg-[#e6ebdf] active:cursor-grabbing ${ASPECT_CLASS[aspect]}`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
          <img ref={imageRef} src={shown} alt="Image crop preview" draggable={false} className="h-full w-full select-none object-cover"
            style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${zoom})`, transformOrigin: "center" }}
            onLoad={() => setOff((o) => clampOff(o.x, o.y, zoom))} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" aria-label="Zoom out" onClick={() => changeZoom(zoom - 0.25)} className={btn}><ZoomOut size={17} /></button>
          <input type="range" aria-label="Zoom" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="h-2 min-w-0 flex-1 accent-brand" />
          <button type="button" aria-label="Zoom in" onClick={() => changeZoom(zoom + 0.25)} className={btn}><ZoomIn size={17} /></button>
          <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink/65 hover:bg-paper"><RotateCcw size={14} />Reset</button>
        </div>

        {enhanceable && <button type="button" onClick={toggleEnhance} disabled={working} aria-pressed={useEnhanced}
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${useEnhanced ? "border-brand bg-brand text-white" : "border-line bg-white hover:bg-paper"}`}>
          <Sparkles size={14} />{working && !useEnhanced ? "Enhancing…" : useEnhanced ? "Free AI Enhance: on" : "Free AI Enhance"}
        </button>}
        {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}

        <div className="mt-4 flex gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1 sm:flex-none">Cancel</button>
          <button type="button" onClick={apply} disabled={working} className="btn-primary flex-1 sm:flex-none">{working ? "Working…" : "Use this photo"}</button>
        </div>
      </section>
    </div>
  );
}
