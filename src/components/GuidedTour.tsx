import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export const START_TOUR_EVENT = "knust:start-tour";
const PENDING_KEY = "knust:tour-pending";
/** Call right after a brand-new account is verified so the tour starts on the next screen. */
export const queueTour = () => { try { localStorage.setItem(PENDING_KEY, "1"); } catch { /* storage unavailable */ } };

interface Step { target: string; title: string; body: string; route?: (id: string) => string }

const STEPS: Step[] = [
  { target: "mystore", title: "Your store", body: "This is your public page where your listings appear.", route: (id) => `/vendors/${id}` },
  { target: "add-product", title: "Add your first listing", body: "Tap here, choose Product or Service, add photos and publish.", route: (id) => `/vendors/${id}` },
  { target: "orders", title: "Orders", body: "When someone orders, you’ll see it here. Hand over the item, get paid by MoMo or cash." },
];

const visible = (target: string): HTMLElement | null => {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
};

/** Grey spotlight tour that points at real buttons. Starts for new accounts or when replayed from Settings. */
export default function GuidedTour() {
  const { me, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [idx, setIdx] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const el = useRef<HTMLElement | null>(null);
  const dir = useRef<1 | -1>(1);

  const end = useCallback(() => {
    setIdx(null); setRect(null); el.current = null;
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!me || loading || idx !== null) return;
    try { if (localStorage.getItem(PENDING_KEY)) { dir.current = 1; setIdx(0); } } catch { /* ignore */ }
  }, [me?.id, loading]);
  useEffect(() => {
    const start = () => { dir.current = 1; setIdx(0); };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  // Navigate if needed, wait for the target to appear, skip steps whose target doesn't exist.
  useEffect(() => {
    if (idx === null || !me) return;
    const step = STEPS[idx];
    const route = step.route?.(me.id);
    if (route && location.pathname !== route) { setRect(null); nav(route); return; }
    let tries = 0, cancelled = false;
    const find = () => {
      if (cancelled) return;
      const found = visible(step.target);
      if (found) {
        el.current = found;
        found.scrollIntoView({ block: "center", behavior: "auto" });
        setRect(found.getBoundingClientRect());
      } else if (++tries > 15) {
        const next = idx + dir.current;
        if (next < 0 || next >= STEPS.length) end(); else setIdx(next);
      } else window.setTimeout(find, 100);
    };
    setRect(null);
    find();
    return () => { cancelled = true; };
  }, [idx, location.pathname, me?.id]);

  useLayoutEffect(() => {
    if (idx === null) return;
    const update = () => { if (el.current) setRect(el.current.getBoundingClientRect()); };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") end(); };
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); document.removeEventListener("keydown", onKey); };
  }, [idx, end]);

  if (idx === null || !me) return null;
  const step = STEPS[idx];
  const go = (d: 1 | -1) => { dir.current = d; const n = idx + d; if (n >= STEPS.length) end(); else if (n >= 0) setIdx(n); };

  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(320, vw - 24);
  const pad = 6;
  const below = rect ? rect.top < vh / 2 : true;
  const tip: React.CSSProperties = rect
    ? { left: Math.max(12, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 12)), width: w, ...(below ? { top: Math.min(rect.bottom + pad + 12, vh - 12) } : { bottom: Math.max(vh - rect.top + pad + 12, 12) }) }
    : { left: 12, right: 12, bottom: 24, margin: "0 auto", width: w };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Grey backdrop with a cut-out around the highlighted control; also blocks stray clicks. */}
      {rect
        ? <div aria-hidden="true" className="pointer-events-none absolute rounded-2xl transition-all duration-200" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(58,58,58,.68), 0 0 0 2px #fff" }} />
        : <div aria-hidden="true" className="absolute inset-0 bg-[rgba(58,58,58,.68)]" />}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      <div className="absolute rounded-2xl bg-white p-4 shadow-2xl" style={tip}>
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-gold">Step {idx + 1} of {STEPS.length}</p>
        <h2 className="mt-1 font-display text-lg font-bold">{step.title}</h2>
        <p className="mt-1 text-sm leading-5 text-ink/70">{rect ? step.body : "Loading…"}</p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={end} className="mr-auto text-xs font-semibold text-ink/55 hover:text-ink">Skip tour</button>
          {idx > 0 && <button type="button" onClick={() => go(-1)} className="btn-ghost px-3 py-2 text-xs">Back</button>}
          <button type="button" onClick={() => go(1)} className="btn-primary px-4 py-2 text-xs">{idx === STEPS.length - 1 ? "Done" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
