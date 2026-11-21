import { FormEvent, useState } from "react";
import { api } from "../api";
import { suggestEmail } from "../emailCheck";

/** Lets someone who mistyped their email at sign-up fix it and get a fresh code or link. */
export default function ChangeEmailForm({ email, onChanged }: { email: string; onChanged: (email: string, accountType: string) => void }) {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const suggestion = suggestEmail(next);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api<{ email: string; account_type: string }>("/auth/change-email", { method: "POST", body: { email, password, new_email: next.trim().toLowerCase() } });
      setOpen(false); setNext(""); setPassword("");
      onChanged(r.email, r.account_type);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-brand underline underline-offset-4">Wrong email? Change it</button>;
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-white p-4 text-left">
      <p className="text-sm font-semibold">Fix your email</p>
      <input className="input" type="email" autoComplete="email" placeholder="Correct email address" value={next} onChange={(e) => setNext(e.target.value)} required />
      {suggestion && <button type="button" onClick={() => setNext(suggestion)} className="text-xs text-ink/70">Did you mean <b className="text-brand underline">{suggestion}</b>?</button>}
      <input className="input" type="password" autoComplete="current-password" placeholder="Your password (to confirm it’s you)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost flex-1" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary flex-1" disabled={busy}>{busy ? "Updating…" : "Send new code"}</button>
      </div>
    </form>
  );
}
