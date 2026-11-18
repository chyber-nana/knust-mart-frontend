import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";

/** Shown the moment the sign-up page opens: students must register with their KNUST student email. */
export default function StudentEmailPopup() {
  const [open, setOpen] = useState(true);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-3">
      <section role="dialog" aria-modal="true" aria-labelledby="student-email-title" className="w-full max-w-md rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand"><GraduationCap size={22} aria-hidden="true" /></div>
        <h2 id="student-email-title" className="mt-3 font-display text-xl font-bold">Use your student email</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Register with your KNUST student email, the one that ends with{" "}
          <strong className="whitespace-nowrap text-ink">@st.knust.edu.gh</strong>.
        </p>
        <p className="mt-2 rounded-xl bg-gold/10 px-3.5 py-3 text-sm leading-5 text-ink/75">
          If you sign up with any other email, you will be identified as an <strong>external vendor or person</strong>, not a student.
        </p>
        <button ref={button} type="button" className="btn-primary mt-5 w-full" onClick={() => setOpen(false)}>Got it</button>
      </section>
    </div>
  );
}
