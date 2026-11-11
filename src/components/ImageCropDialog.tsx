import { useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, X } from "lucide-react";

interface CropPosition {
  x: number;
  y: number;
}

interface ImageCropDialogProps {
  src: string;
  title: string;
  aspect: "square" | "banner";
  position: CropPosition;
  onCancel: () => void;
  onApply: (position: CropPosition) => void;
}

interface DragStart extends CropPosition {
  pointerX: number;
  pointerY: number;
}

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));

export default function ImageCropDialog({
  src,
  title,
  aspect,
  position,
  onCancel,
  onApply,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState(position);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<DragStart | null>(null);

  const move = (x: number, y: number) => {
    setCrop((current) => ({ x: clamp(current.x + x), y: clamp(current.y + y) }));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      ...crop,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!start || !stage || !image?.naturalWidth || !image.naturalHeight) return;

    const bounds = stage.getBoundingClientRect();
    const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
    const overflowX = image.naturalWidth * scale - bounds.width;
    const overflowY = image.naturalHeight * scale - bounds.height;
    setCrop({
      x: overflowX > 0 ? clamp(start.x - ((event.clientX - start.pointerX) / overflowX) * 100) : 50,
      y: overflowY > 0 ? clamp(start.y - ((event.clientY - start.pointerY) / overflowY) * 100) : 50,
    });
  };

  const stopDragging = () => {
    dragStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-dialog-title"
        className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="crop-dialog-title" className="font-display text-xl font-bold">Adjust {title.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-ink/60">Drag the image to choose what appears in your storefront.</p>
          </div>
          <button type="button" aria-label="Close crop dialog" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper">
            <X size={18} />
          </button>
        </div>

        <div
          ref={stageRef}
          className={`mx-auto max-h-[55vh] w-full max-w-full touch-none cursor-grab overflow-hidden rounded-xl bg-[#e6ebdf] active:cursor-grabbing ${aspect === "square" ? "aspect-square max-w-sm" : "aspect-[3/1]"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={stopDragging}
        >
          <img
            ref={imageRef}
            src={src}
            alt="Image crop preview"
            draggable={false}
            className="h-full w-full select-none object-cover"
            style={{ objectPosition: `${crop.x}% ${crop.y}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Move image left" onClick={() => move(5, 0)} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-paper"><ArrowLeft size={17} /></button>
            <div className="grid gap-1">
              <button type="button" aria-label="Move image up" onClick={() => move(0, 5)} className="grid h-8 w-10 place-items-center rounded-lg border border-line hover:bg-paper"><ArrowUp size={16} /></button>
              <button type="button" aria-label="Move image down" onClick={() => move(0, -5)} className="grid h-8 w-10 place-items-center rounded-lg border border-line hover:bg-paper"><ArrowDown size={16} /></button>
            </div>
            <button type="button" aria-label="Move image right" onClick={() => move(-5, 0)} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-paper"><ArrowRight size={17} /></button>
            <button type="button" onClick={() => setCrop({ x: 50, y: 50 })} className="ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink/65 hover:bg-paper">
              <RotateCcw size={14} />Center
            </button>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={onCancel} className="btn-ghost flex-1 sm:flex-none">Cancel</button>
            <button type="button" onClick={() => onApply(crop)} className="btn-primary flex-1 sm:flex-none">Use this crop</button>
          </div>
        </div>
      </section>
    </div>
  );
}
