import { useEffect, useRef } from "react";

const LOGO_URL = "https://vkhgvaencdidocddyorp.supabase.co/storage/v1/object/public/knust-mart/logo.jpg";

/** Short branded flash on the very first sign-up visit. Tapping it skips straight through. */
export default function KnustSplash({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = window.setTimeout(() => done.current(), 1400);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="fixed inset-0 z-[80] grid place-items-center bg-[var(--surface)]"
    >
      <span className="flex flex-col items-center gap-4">
        <img src={LOGO_URL} alt="" className="splash-logo h-20 w-20 rounded-[28%] object-contain" />
        <span className="splash-word font-display text-3xl font-bold tracking-tight text-brand">
          KNUST <span className="text-ink">Mart</span>
        </span>
      </span>
    </button>
  );
}
