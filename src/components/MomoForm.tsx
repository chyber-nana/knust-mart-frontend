import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";

interface Momo { momo_network: string | null; momo_number: string | null; momo_name: string | null; confirmed: boolean }

/** Seller payout recipient setup. A paid setup is required; ordinary sellers cannot remove it. */
export default function MomoForm() {
  const { me } = useAuth();
  const [saved, setSaved] = useState<Momo | null>(null);
  const [network, setNetwork] = useState("mtn");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<Momo>("/payments/momo").then((m) => { setSaved(m); if (m.momo_network) setNetwork(m.momo_network); }).catch(() => undefined);
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(""); setMessage("");
    try {
      const result = await api<{ authorization_url?: string; momo_network?: string; momo_number?: string; momo_name?: string; confirmed?: boolean }>("/payments/momo/setup", { method: "POST", body: { network, number } });
      if (result.authorization_url) { window.location.assign(result.authorization_url); return; }
      setSaved({ momo_network: result.momo_network ?? network, momo_number: result.momo_number ?? number, momo_name: result.momo_name ?? null, confirmed: !!result.confirmed });
      setNumber(""); setMessage("Admin test recipient created. You can remove this test record below.");
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  const deleteTest = async () => {
    if (!window.confirm("Remove your admin test payout details from KNUST Mart?")) return;
    setBusy(true); setErr("");
    try { await api("/payments/momo/admin-test", { method: "DELETE" }); setSaved({ momo_network: null, momo_number: null, momo_name: null, confirmed: false }); setMessage("Admin test payout details cleared from this account."); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-bold">Payout MoMo account</h2>
        <p className="mt-1 text-xs text-ink/60">Register a MoMo account as a Paystack transfer recipient. Seller setup costs GH₵10. This enables buyers to pay in-app; the seller receives the item price after the buyer confirms receipt. Admin test accounts bypass the fee.</p>
      </div>
      {saved?.confirmed && <p className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />Verified: {saved.momo_number} ({saved.momo_network?.toUpperCase()}), registered to {saved.momo_name}. Your payout account cannot be removed from a normal seller account. To change it, complete a new verified setup.</p>}
      <div className="flex gap-2">
        <select className="input w-40" value={network} onChange={(e) => setNetwork(e.target.value)} aria-label="Network"><option value="mtn">MTN</option><option value="vodafone">Telecel</option><option value="airteltigo">AirtelTigo</option></select>
        <input className="input flex-1" inputMode="tel" placeholder="0241234567" value={number} onChange={(e) => setNumber(e.target.value)} aria-label="MoMo number" required />
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      <button className="btn-primary w-full" disabled={busy || number.trim().length < 9}>{busy ? "Starting secure setup…" : me?.is_admin ? (saved?.confirmed ? "Replace admin test account" : "Create admin test recipient") : saved?.confirmed ? "Pay GH₵10 to replace account" : "Pay GH₵10 and register account"}</button>
      {me?.is_admin && saved?.confirmed && <button type="button" className="btn-ghost w-full" disabled={busy} onClick={deleteTest}>Delete admin test payout account</button>}
      <p className="flex items-start gap-2 text-[11px] leading-4 text-ink/50"><ShieldCheck size={14} className="mt-0.5 shrink-0" />Your number is checked with Paystack. We save the account only after a transfer recipient is successfully created.</p>
    </form>
  );
}
