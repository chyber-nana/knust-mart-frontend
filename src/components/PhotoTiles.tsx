import { ChangeEvent } from "react";
import { Camera, ImagePlus } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp";
const TILE = "grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-ink/30 text-xs text-ink/60 hover:bg-paper";

export default function PhotoTiles({ onChange, busy }: { onChange: (e: ChangeEvent<HTMLInputElement>) => void; busy: boolean }) {
  return (
    <>
      <label className={TILE}>
        <span className="flex flex-col items-center gap-1"><Camera size={20} aria-hidden="true" />{busy ? "Uploading…" : "Take photo"}</span>
        <input type="file" accept={ACCEPT} capture="environment" className="hidden" onChange={onChange} disabled={busy} />
      </label>
      <label className={TILE}>
        <span className="flex flex-col items-center gap-1"><ImagePlus size={20} aria-hidden="true" />{busy ? "Uploading…" : "Gallery"}</span>
        <input type="file" accept={ACCEPT} multiple className="hidden" onChange={onChange} disabled={busy} />
      </label>
    </>
  );
}