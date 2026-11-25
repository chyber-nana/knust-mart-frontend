import { FormEvent, ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, GraduationCap, Store } from "lucide-react";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout";
import ChangeEmailForm from "../components/ChangeEmailForm";
import KnustSplash from "../components/KnustSplash";
import OutlookNotice from "../components/OutlookNotice";
import PasswordChecklist, { isStrongPassword } from "../components/PasswordChecklist";
import { useToast } from "../components/Toast";
import { suggestEmail } from "../emailCheck";
import { CURRENT_TERMS_VERSION } from "../terms";

const STUDENT_DOMAINS = ["@st.knust.edu.gh", "@idl.knust.edu.gh"];
type AccountType = "student" | "external";
type StepState = "done" | "active" | "todo";

/** One numbered step: the active one shows its form, finished ones collapse to a summary line. */
function Step({ n, title, state, summary, onEdit, last, children }: {
  n: number; title: string; state: StepState; summary?: string; onEdit?: () => void; last?: boolean; children?: ReactNode;
}) {
  const dot = state === "active" ? "border-brand bg-brand text-white"
    : state === "done" ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-ink/40";
  return (
    <section className={`relative pl-12 transition-opacity duration-500 ${last ? "" : "pb-8"} ${state === "todo" ? "opacity-40" : state === "done" ? "opacity-60" : ""}`}>
      <span className={`absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition-colors duration-500 ${dot}`}>
        {state === "done" ? <Check size={16} /> : n}
      </span>
      {!last && <span aria-hidden="true" className="absolute bottom-0 left-[17px] top-10 w-px bg-line" />}
      <div className="flex min-h-9 items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {state === "done" && onEdit && <button type="button" onClick={onEdit} className="text-xs font-semibold text-brand hover:underline">Change</button>}
      </div>
      {state === "done" && summary && <p className="text-sm text-ink/60">{summary}</p>}
      {state === "active" && <div className="step-rise mt-3">{children}</div>}
    </section>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <span className="relative block">
        <input className="input pr-12" type={show ? "text" : "password"} autoComplete="new-password" placeholder={label}
          value={value} onChange={(e) => onChange(e.target.value)} minLength={8} maxLength={72} required />
        <button type="button" aria-label="Toggle password visibility" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

const choice = (on: boolean) =>
  `rounded-xl border px-3 py-2 text-sm font-semibold transition ${on ? "border-brand bg-brand/5 text-brand" : "border-line bg-white text-ink/70"}`;
export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem("km_splash"); } catch { return false; } });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<AccountType | null>(null);
  const [outlook, setOutlook] = useState<"yes" | "no" | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [typoIgnored, setTypoIgnored] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const suggestion = typoIgnored === normalizedEmail ? null : suggestEmail(normalizedEmail);
  const studentEmail = STUDENT_DOMAINS.some((d) => normalizedEmail.endsWith(d));
  const state = (n: number): StepState => (n < step ? "done" : n === step ? "active" : "todo");

  if (splash) return <KnustSplash onDone={() => { try { sessionStorage.setItem("km_splash", "1"); } catch { /* ignore */ } setSplash(false); }} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setMessage("");
    if (type === "student" && !studentEmail) { setErr("Use your @st.knust.edu.gh or @idl.knust.edu.gh email, or go back and choose “Not a student”."); return; }
    if (type === "external" && studentEmail) { setErr("That's a student email. Go back and choose “KNUST student”."); return; }
    if (suggestion) { setErr(`Check your email: did you mean ${suggestion}?`); return; }
    if (!/^\+?[0-9][0-9 ()-]{5,30}$/.test(phone.trim())) { setErr("Enter a valid phone number, e.g. 024 123 4567."); return; }
    if (!isStrongPassword(password)) { setErr("Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol."); return; }
    if (password !== confirmPassword) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      // The server still decides student vs. external from the email domain.
      await api("/auth/register", {
        method: "POST",
        body: {
          full_name: fullName.trim(), email: normalizedEmail, phone_number: phone.trim(),
          password, confirm_password: confirmPassword,
          terms_accepted: termsAccepted, terms_version: CURRENT_TERMS_VERSION,
        },
      });
      toast("Account created", studentEmail ? "Check your student email for the verification code." : "Check your email for the verification link.");
      if (studentEmail) nav(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
      else { setMessage(`We sent a verification link to ${normalizedEmail}. It will sign you in when you confirm your address.`); setStep(3); }
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  const cards = [
    ["student", GraduationCap, "KNUST student", "Buy and sell on campus."],
    ["external", Store, "Not a student", "Sell on KNUST Mart as an outside vendor. You can sell, but buying is for students."],
  ] as const;
return (
    <AuthLayout>
      <div className="mb-7">
        <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-ink/65">We verify every account so buyers and sellers on campus can trust each other.</p>
      </div>

      <Step n={1} title="Account type" state={state(1)} onEdit={step === 2 ? () => setStep(1) : undefined}
        summary={type === "student" ? "KNUST student" : "Not a student"}>
        <div className="grid gap-3">
          {cards.map(([key, Icon, title, text]) => (
            <button key={key} type="button" aria-pressed={type === key} onClick={() => { setType(key); setOutlook(null); }}
              className={`rounded-2xl border p-4 text-left transition ${type === key ? "border-brand bg-brand/5" : "border-line bg-white hover:border-brand/40"}`}>
              <span className="flex items-center gap-2 font-semibold"><Icon size={18} className="text-brand" />{title}</span>
              <span className="mt-1 block text-sm text-ink/65">{text}</span>
            </button>
          ))}
        </div>
        {type === "student" && (
          <div className="step-rise mt-4 space-y-3">
            <OutlookNotice showButton />
            <p className="text-sm font-semibold">Can you sign in to your student Outlook?</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={choice(outlook === "yes")} onClick={() => setOutlook("yes")}>Yes, I can</button>
              <button type="button" className={choice(outlook === "no")} onClick={() => setOutlook("no")}>Not yet</button>
            </div>
            {outlook === "no" && <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3 text-sm">Set up your Outlook first, because your code only goes there. The KNUST UITS helpdesk can activate or reset it. Then come back, it takes about 2 minutes.</p>}
          </div>
        )}
        {type === "external" && <p className="step-rise mt-4 rounded-xl bg-brand/5 px-3.5 py-3 text-xs leading-5 text-ink/70">You can use any email. We send a link to confirm it, and you can start selling right after.</p>}
        <button type="button" className="btn-primary mt-5 w-full rounded-xl py-3" onClick={() => setStep(2)}
          disabled={!type || (type === "student" && outlook !== "yes")}>Continue</button>
      </Step>

      <Step n={2} title="Your details" state={state(2)} summary={normalizedEmail}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Full name</span>
            <input className="input" autoComplete="name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{type === "student" ? "Student email" : "Email address"}</span>
            <input className="input" type="email" autoComplete="email" placeholder={type === "student" ? "you@st.knust.edu.gh" : "you@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {suggestion && <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3 text-sm">Did you mean <button type="button" className="font-bold text-brand underline" onClick={() => setEmail(suggestion)}>{suggestion}</button>? <button type="button" className="ml-1 text-xs text-ink/60 underline" onClick={() => setTypoIgnored(normalizedEmail)}>No, it’s correct</button></p>}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Phone number (WhatsApp if possible)</span>
            <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32} required />
            <span className="block text-xs text-ink/60">Not shown to other users.</span>
          </label>
          <PasswordField label="Password" value={password} onChange={setPassword} />
          <PasswordChecklist password={password} />
          <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
          <label className="flex items-start gap-3 text-sm leading-5 text-ink/70">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required />
            <span>I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">Terms and Conditions</Link>.</span>
          </label>
          {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl py-3.5 shadow-lg shadow-brand/15" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
      </Step>

      <Step n={3} title="Verify your email" state={state(3)} last>
        <p role="status" className="rounded-xl bg-brand/5 px-4 py-3 text-sm text-brand">{message}</p>
        <div className="mt-3 text-center">
          <ChangeEmailForm email={normalizedEmail} onChanged={(next, t) => {
            setEmail(next);
            if (t === "student") nav(`/verify?email=${encodeURIComponent(next)}`);
            else setMessage(`We sent a new verification link to ${next}.`);
          }} />
        </div>
      </Step>

      <p className="mt-8 text-center text-sm text-ink/65">Already registered? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
