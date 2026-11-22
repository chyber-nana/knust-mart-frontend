import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "../api";

interface Momo { momo_network: string | null; momo_number: string | null; momo_name: string | null; confirmed: boolean }

/** Payout number for sellers and couriers. Paystack name-checks it and we show the registered name back. */
export default function MomoForm() {
  const [saved, setSaved] = useState<Momo | null>(null);
  const [network, setNetwork] = useState("mtn");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<Momo>("/payments/momo").then((m) => { setSaved(m); if (m.momo_network) setNetwork(m.momo_network); }).catch(() => undefined);
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { setSaved(await api<Momo>("/payments/momo", { method: "PUT", body: { network, number } })); setNumber(""); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-bold">Payout MoMo number</h2>
        <p className="mt-1 text-xs text-ink/60">Sellers receive the item price here when a handover is confirmed. Couriers receive their delivery fees here in one weekly payment. Required before you can accept orders or deliveries.</p>
      </div>
      {saved?.confirmed && <p className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />Confirmed: {saved.momo_number} ({saved.momo_network?.toUpperCase()}), registered to {saved.momo_name}.</p>}
      <div className="flex gap-2">
        <select className="input w-40" value={network} onChange={(e) => setNetwork(e.target.value)} aria-label="Network">
          <option value="mtn">MTN</option><option value="vodafone">Vodafone</option><option value="airteltigo">AirtelTigo</option>
        </select>
        <input className="input flex-1" inputMode="tel" placeholder="0241234567" value={number} onChange={(e) => setNumber(e.target.value)} aria-label="MoMo number" required />
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full" disabled={busy || number.trim().length < 9}>{busy ? "Checking name…" : saved?.confirmed ? "Change number" : "Confirm number"}</button>
    </form>
  );
}
