import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useAuth } from "../auth";
import { GUIDES, guideById } from "../guides";

const key = (id: string) => `knust:welcome-seen:${id}`;
export const SHOW_WELCOME_EVENT = "knust:show-welcome";
const SLIDES = ["create-business", "add-products", "become-courier", "courier-tasks"].map(guideById);

/** Full-screen welcome tour shown once per user on a device; replayable from Settings. */
export default function OnboardingOverlay() {
  const { me } = useAuth();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!me) return;
    try { if (!localStorage.getItem(key(me.id))) setOpen(true); } catch { /* storage unavailable */ }
  }, [me?.id]);
  useEffect(() => {
    const show = () => { setI(0); setOpen(true); };
    window.addEventListener(SHOW_WELCOME_EVENT, show);
    return () => window.removeEventListener(SHOW_WELCOME_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const close = () => {
    setOpen(false);
    try { if (me) localStorage.setItem(key(me.id), "1"); } catch { /* ignore */ }
  };
  if (!open || !me) return null;
  const welcome = i === 0;
  const g = welcome ? null : SLIDES[i - 1];
  const last = i === SLIDES.length;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex gap-1.5" aria-label={`Step ${i + 1} of ${SLIDES.length + 1}`}>
            {[...Array(SLIDES.length + 1)].map((_, n) => <span key={n} className={`h-1.5 w-7 rounded-full ${n <= i ? "bg-brand" : "bg-line"}`} />)}
          </div>
          <button type="button" onClick={close} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-ink/60 hover:bg-paper"><X size={14} />Skip</button>
        </div>
        <div className="overflow-y-auto px-5 py-6 sm:px-7">
          {welcome ? <>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Welcome</p>
            <h2 id="welcome-title" className="mt-1 font-display text-2xl font-bold">Welcome to KNUST Mart, {me.full_name.split(" ")[0]}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">Buy and sell on campus, open your own business, or earn as a courier. Here’s a quick tour of how everything works. It takes about a minute.</p>
            <ul className="mt-5 space-y-2">{SLIDES.map((s) => <li key={s.id} className="rounded-xl bg-[#e6ebdf] px-3.5 py-2.5 text-sm"><b>{s.title}</b><span className="block text-xs text-ink/65">{s.summary}</span></li>)}</ul>
          </> : g && <>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Step {i} of {SLIDES.length}</p>
            <h2 id="welcome-title" className="mt-1 font-display text-2xl font-bold">{g.title}</h2>
            <p className="mt-1 text-sm text-ink/65">{g.summary}</p>
            <ol className="mt-5 space-y-3">{g.steps.map((s, n) => <li key={s.title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n + 1}</span>
              <span className="text-sm"><b className="block">{s.title}</b><span className="text-ink/70">{s.body}</span></span>
            </li>)}</ol>
            {g.cta && <Link to={g.cta.to} onClick={close} className="btn-ghost mt-5 inline-flex">{g.cta.label}</Link>}
          </>}
        </div>
        <div className="flex gap-2 border-t border-line px-5 py-3">
          <button type="button" className="btn-ghost" disabled={welcome} onClick={() => setI(i - 1)}><ArrowLeft size={15} />Back</button>
          <button type="button" className="btn-primary flex-1" onClick={last ? close : () => setI(i + 1)}>{last ? "Got it, start exploring" : welcome ? "Start the tour" : "Next"}{!last && <ArrowRight size={15} />}</button>
        </div>
      </div>
    </div>
  );
}
