import { ReactNode, useEffect, useState } from "react";
import { Coins, Store } from "lucide-react";
import { BASE } from "../api";

const TIPS = [
  "Meet buyers in busy spots like the library or the Student Union Building.",
  "Clear, bright photos sell faster. Daylight is free!",
  "Add your hall or hostel to every listing so couriers know where to go.",
  "Answer chats quickly. Fast sellers get better reviews.",
  "Selling a service? Say what you offer and your usual turnaround time.",
  "Use the QR receipt at handover so both sides are protected.",
  "A short, honest description beats a long, vague one.",
  "Student emails live in Outlook. Check Junk if a code is slow.",
];

function Logo({ pulse }: { pulse?: boolean }) {
  return (
    <div className="relative grid h-20 w-20 place-items-center">
      {pulse && <span aria-hidden="true" className="wake-ring absolute inset-0 rounded-[30%] bg-brand/30" />}
      <div className="wake-logo relative grid h-20 w-20 place-items-center rounded-[30%] bg-brand text-white shadow-lg shadow-brand/30">
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
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);
  const [taps, setTaps] = useState(0);

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
        setAttempt(i + 1);
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
  const tip = TIPS[Math.floor(elapsed / 5) % TIPS.length];
  const stuck = elapsed > 75 && !ready;

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center"><Logo pulse /></div>
        <h1 className="font-display text-2xl font-bold">{ready ? "All set!" : "Waking up KNUST Mart"}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {ready ? "Taking you in…" : "The server naps when it's quiet. This can take up to a minute."}
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Waking up the server">
          <div className="wake-bar h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
        {!ready && attempt > 0 && <p className="mt-2 text-xs text-ink/45">Still knocking… attempt {attempt}</p>}

        <p key={tip} className="wake-tip mt-7 min-h-[3rem] rounded-2xl bg-brand/5 px-4 py-3 text-sm leading-5 text-ink/75">
          <span className="font-semibold text-brand">Campus tip: </span>{tip}
        </p>

        <button
          type="button"
          onClick={() => setTaps((count) => count + 1)}
          className="coin-tap mx-auto mt-6 flex items-center gap-2 rounded-full border border-line bg-[var(--surface)] px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-brand/40"
        >
          <Coins size={18} className="text-gold" aria-hidden="true" />
          Tap the cedi while you wait
          <span className="min-w-[2ch] rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{taps}</span>
        </button>
        {taps >= 10 && <p className="wake-tip mt-2 text-xs text-ink/55">{taps >= 30 ? "Okay, you should run a store 💰" : "Nice reflexes! 🚀"}</p>}

        {stuck && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-ink/70">This is taking longer than usual.</p>
            <div className="flex justify-center gap-2">
              <button type="button" className="btn-primary" onClick={() => { setElapsed(0); setAttempt(0); setRun((n) => n + 1); }}>Try again</button>
              <button type="button" className="btn-ghost" onClick={() => setDone(true)}>Continue anyway</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
