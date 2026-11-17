import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Store } from "lucide-react";
import { BASE } from "../api";

const STATUS_MESSAGES = ["Waking the server", "Stocking the shelves", "Almost open"];
const CELLS = 9;

/** Tap-the-target reaction game: one tile lights up, tap it before it moves. Speeds up as you score. */
function TapGame() {
  const [target, setTarget] = useState(4);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [miss, setMiss] = useState(false);
  const scoreRef = useRef(0);
  const timer = useRef<number>();

  const next = useCallback((from: number) => {
    window.clearTimeout(timer.current);
    let cell = from;
    while (cell === from) cell = Math.floor(Math.random() * CELLS);
    setTarget(cell);
    const delay = Math.max(550, 1100 - scoreRef.current * 25);
    timer.current = window.setTimeout(() => {
      if (scoreRef.current > 0) { scoreRef.current = 0; setScore(0); setMiss(true); window.setTimeout(() => setMiss(false), 250); }
      next(cell);
    }, delay);
  }, []);

  useEffect(() => { next(4); return () => window.clearTimeout(timer.current); }, [next]);

  const press = (cell: number) => {
    if (cell === target) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setBest((value) => Math.max(value, scoreRef.current));
      next(cell);
    } else if (scoreRef.current > 0) {
      scoreRef.current = 0;
      setScore(0);
      setMiss(true);
      window.setTimeout(() => setMiss(false), 250);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-[16rem]">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-ink/60">
        <span>Score <span className="ml-1 tabular-nums text-ink">{score}</span></span>
        <span>Best <span className="ml-1 tabular-nums text-ink">{best}</span></span>
      </div>
      <div className={`grid grid-cols-3 gap-2 ${miss ? "wake-miss" : ""}`} role="group" aria-label="Tap the lit tile">
        {Array.from({ length: CELLS }, (_, cell) => (
          <button
            key={cell}
            type="button"
            aria-label={cell === target ? "Lit tile, tap it" : "Empty tile"}
            onPointerDown={() => press(cell)}
            className={`wake-tile aspect-square touch-manipulation select-none rounded-xl border transition-colors duration-100 ${cell === target ? "wake-tile-on border-brand bg-brand" : "border-line bg-[var(--surface)]"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Logo({ pulse }: { pulse?: boolean }) {
  return (
    <div className="relative grid h-20 w-20 place-items-center">
      {pulse && <span aria-hidden="true" className="wake-ring absolute inset-0 rounded-[30%] bg-brand/30" />}
      <div className="wake-logo relative grid h-20 w-20 place-items-center rounded-[30%] bg-brand text-white">
        <Store size={34} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Holds the app back until the API answers. The server may be asleep (cold start),
 * and loading the app against a sleeping server would show errors and, worse, could
 * look like a sign-out. A fast API never shows more than a brief logo.
 */
export default function WakeGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    const slowTimer = window.setTimeout(() => { if (alive) setSlow(true); }, 1200);
    const tick = window.setInterval(() => { if (alive) setElapsed((Date.now() - started) / 1000); }, 300);
    (async () => {
      for (let i = 0; alive; i++) {
        const controller = new AbortController();
        const abort = window.setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(`${BASE}/`, { signal: controller.signal, cache: "no-store" });
          window.clearTimeout(abort);
          if (res.ok) { if (alive) setReady(true); return; }
        } catch {
          /* still waking up */
        }
        window.clearTimeout(abort);
        if (!alive) return;
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(1500 + i * 500, 4000)));
      }
    })();
    return () => { alive = false; window.clearTimeout(slowTimer); window.clearInterval(tick); };
  }, [run]);

  useEffect(() => {
    if (!ready) return;
    if (!slow) { setDone(true); return; }
    const timer = window.setTimeout(() => setDone(true), 700);
    return () => window.clearTimeout(timer);
  }, [ready, slow]);

  if (done) return <>{children}</>;

  if (!slow) {
    return <div className="grid min-h-screen place-items-center bg-paper"><Logo /></div>;
  }

  const progress = ready ? 100 : Math.min(92, 92 * (1 - Math.exp(-elapsed / 20)));
  const status = STATUS_MESSAGES[Math.floor(elapsed / 6) % STATUS_MESSAGES.length];
  const stuck = elapsed > 75 && !ready;

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center"><Logo pulse /></div>
        <h1 className="font-display text-2xl font-bold">{ready ? "All set" : "KNUST Mart is starting"}</h1>
        <p key={ready ? "ready" : status} className="wake-tip mt-1 text-sm text-ink/60" aria-live="polite">{ready ? "Taking you in" : status}</p>

        <div className="mx-auto mt-5 h-1.5 max-w-[16rem] overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Loading">
          <div className="wake-bar h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>

        {!ready && <TapGame />}

        {stuck && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-ink/70">This is taking longer than usual.</p>
            <div className="flex justify-center gap-2">
              <button type="button" className="btn-primary" onClick={() => { setElapsed(0); setRun((n) => n + 1); }}>Try again</button>
              <button type="button" className="btn-ghost" onClick={() => setDone(true)}>Continue anyway</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
