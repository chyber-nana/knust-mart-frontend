import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../auth";
import { WHATSAPP_CHANNEL_URL } from "./WhatsAppChannelCard";

const PENDING_KEY = "knust:wa-popup-pending"; // set by completeAuth after every sign-up verification or login
const JOINED_KEY = "knust:wa-joined";

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

/** Shown once right after sign-up or login, until the person taps Join. */
export default function WhatsAppPopup() {
  const { me } = useAuth();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!me || read(PENDING_KEY) !== "1") return;
    write(PENDING_KEY, null);
    if (read(JOINED_KEY) !== "1") setOpen(true);
  }, [me?.id]);

  useEffect(() => {
    if (!open) return;
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-3">
      <section role="dialog" aria-modal="true" aria-labelledby="wa-popup-title" className="w-full max-w-md rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand"><MessageCircle size={22} aria-hidden="true" /></div>
        <h2 id="wa-popup-title" className="mt-3 font-display text-xl font-bold">Join our WhatsApp channel</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">Get campus deals, updates, and quick tips on how to buy, sell and deliver on KNUST Mart.</p>
        <a ref={button} href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 block w-full text-center"
          onClick={() => { write(JOINED_KEY, "1"); setOpen(false); }}>Join the channel</a>
        <button type="button" className="btn-ghost mt-2 w-full" onClick={() => setOpen(false)}>Maybe later</button>
      </section>
    </div>
  );
}
