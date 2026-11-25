import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Store } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";
import { CURRENT_TERMS_VERSION } from "../terms";
import LocationPicker from "../components/LocationPicker";

interface Activation { active: boolean; activation_type: string | null; free_slots_left: number; fee: number; currency: string }
interface ActivateResult { status: "active" | "payment_required"; activation_type?: string; authorization_url?: string; reference?: string }

export default function CreateBusiness() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [info, setInfo] = useState<Activation | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [businessTermsAccepted, setBusinessTermsAccepted] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  

  useEffect(() => { api<Activation>("/stores/activation").then(setInfo).catch((x) => setErr((x as Error).message)); }, []);
  useEffect(() => { if (info?.active) nav("/store/edit", { replace: true }); }, [info]);
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false); };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  
  const free = (info?.free_slots_left ?? 0) > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const result = await api<ActivateResult>("/stores/activate", {
        method: "POST",
        body: {
          store_name: name.trim(),
          hostel_or_business_address: address.trim() || null,
          phone_number: phone.trim(),
          business_terms_accepted: businessTermsAccepted,
          business_terms_version: CURRENT_TERMS_VERSION,
        },
      });
      if (result.status === "payment_required" && result.authorization_url) {
        window.location.assign(result.authorization_url); // keep the button busy while we leave for Paystack
        return;
      }
      await refresh();
      toast("Your business is live", "Add a logo and banner to finish your storefront.");
      nav("/store/edit", { replace: true });
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><Store size={22} aria-hidden="true" /></div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Create your business</h1>
      </div>

      {info && (
        <p className={`mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${free ? "bg-brand/10 text-brand" : "bg-paper text-ink/75"}`}>
          <Sparkles size={16} aria-hidden="true" />
          {free
            ? <span><b>{info.free_slots_left}</b> free launch {info.free_slots_left === 1 ? "spot" : "spots"} left. Yours is free!</span>
            : <span>Launch spots are taken. One-time activation fee: <b>GH₵{info.fee}</b>.</span>}
        </p>
      )}

      <form onSubmit={submit} className="card space-y-4 rounded-2xl p-4 sm:p-6">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Business name</span>
          <input className="input" placeholder="e.g. Campus Tech Hub" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required />
        </label>
        <label className="flex items-start gap-3 text-sm leading-5 text-ink/70">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={businessTermsAccepted} onChange={(e) => setBusinessTermsAccepted(e.target.checked)} required />
          <span>I confirm I am authorized to operate this business and agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">Terms and Conditions</Link>, including the Business Terms.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Location <span className="font-normal text-ink/50">(optional)</span></span>
          <LocationPicker value={address} onChange={setAddress} placeholder="Choose a hall or hostel" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Phone number</span>
          <input className="input" type="tel" autoComplete="tel" placeholder="+233…" value={phone} onChange={(e) => setPhone(e.target.value)} pattern="\+?[0-9][0-9 ()\-]{5,30}" maxLength={32} required />
          <span className="block text-xs text-ink/55">Buyers and couriers use this to reach your business. Include your country code.</span>
        </label>
        {!free && info && <p className="text-xs text-ink/60">You’ll pay securely with Paystack. Your storefront goes live as soon as the payment is confirmed.</p>}
        {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full rounded-xl py-3.5" disabled={busy || !info || name.trim().length < 2 || !businessTermsAccepted}>
          {busy ? "One moment…" : free || !info ? "Create my business" : `Continue to pay GH₵${info.fee}`}
        </button>
      </form>
    </div>
  );
}
