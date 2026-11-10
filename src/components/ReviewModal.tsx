import { FormEvent, useState } from "react";
import { CheckCircle2, Star, X } from "lucide-react";
import { api } from "../api";

export default function ReviewModal({
  deliveryId,
  productTitle,
  sellerName,
  onClose,
  onSubmitted,
}: {
  deliveryId: string;
  productTitle: string;
  sellerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/reviews", {
        method: "POST",
        body: { delivery_id: deliveryId, rating, comment: comment.trim() || null },
      });
      onSubmitted();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/55 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-2xl">
        <button type="button" aria-label="Close review" onClick={onClose} disabled={busy} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink/60 transition hover:text-ink disabled:opacity-50">
          <X size={17} />
        </button>
        <div className="border-b border-line bg-[#edf1e8] px-6 pb-5 pt-7">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-[32%] bg-white text-brand shadow-sm"><CheckCircle2 size={24} /></div>
          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-brand">Order received</p>
          <h2 id="review-title" className="mt-1 pr-8 font-display text-2xl font-bold tracking-tight">Rate your experience</h2>
          <p className="mt-1 truncate text-sm text-ink/65">{productTitle} · {sellerName}</p>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">How was your experience?</legend>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                  className="grid h-11 w-11 place-items-center rounded-xl transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Star size={25} className={(hoverRating || rating) >= value ? "fill-[#d9a441] text-[#a66c00]" : "text-ink/25"} />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-ink/70">{rating} / 5</span>
            </div>
          </fieldset>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Share a comment <span className="font-normal text-ink/45">(optional)</span></span>
            <textarea className="input min-h-24 resize-y" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="What should other students know?" />
            <span className="block text-right text-[11px] text-ink/40">{comment.length}/1000</span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-ghost w-full" onClick={onClose} disabled={busy}>Later</button>
            <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Submit review"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
