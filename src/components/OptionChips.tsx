import { useState } from "react";
import { X } from "lucide-react";

export const COLOR_SUGGESTIONS = ["Black", "White", "Blue", "Red", "Green", "Grey", "Brown", "Pink"];
export const SIZE_SUGGESTIONS = ["S", "M", "L", "XL", "XXL", "38", "40", "42", "44"];
const MAX = 12;

export default function OptionChips({ label, hint, value, onChange, suggestions }: { label: string; hint: string; value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const v = raw.trim().slice(0, 20);
    if (!v || value.length >= MAX || value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="text-sm font-semibold">{label} <span className="text-xs font-normal text-ink/50">(optional)</span></p>
      <p className="text-xs text-ink/55">{hint}</p>
      {value.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-[#e6ebdf] px-2.5 py-1 text-xs font-semibold text-brand">{v}
          <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}><X size={12} /></button></span>))}</div>}
      <div className="mt-2 flex flex-wrap gap-1.5">{suggestions.filter((s) => !value.some((x) => x.toLowerCase() === s.toLowerCase())).map((s) => (
        <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70">+ {s}</button>))}</div>
      <div className="mt-2 flex gap-2">
        <input className="input min-w-0 flex-1" placeholder="Add your own" maxLength={20} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }} />
        <button type="button" className="rounded-lg border border-line px-3 text-sm font-semibold" onClick={() => add(draft)}>Add</button>
      </div>
    </div>
  );
}
