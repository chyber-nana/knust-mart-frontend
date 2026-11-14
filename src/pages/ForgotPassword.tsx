import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout";
import OutlookNotice from "../components/OutlookNotice";
import PasswordChecklist, { isStrongPassword } from "../components/PasswordChecklist";
import { useToast } from "../components/Toast";

const STUDENT_DOMAINS = ["@st.knust.edu.gh", "@idl.knust.edu.gh"];

export default function ForgotPassword() {
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const studentEmail = STUDENT_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true); setErr(""); setMessage("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: normalizedEmail } });
      setStep("reset");
      setMessage("If that account exists, we sent a 6-digit code. It expires in 10 minutes.");
      setCountdown(60);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!isStrongPassword(password)) { setErr("Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol."); return; }
    if (password !== confirmPassword) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { email: normalizedEmail, otp_code: code, new_password: password } });
      toast("Password updated", "You can sign in with your new password.");
      nav("/login", { replace: true });
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand"><KeyRound size={23} /></div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-ink/65">{step === "email" ? "Enter your account email and we’ll send a 6-digit code." : "Enter the code and choose a new password."}</p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="card space-y-4 rounded-[1.6rem] border border-line/80 bg-[var(--surface)] p-5 sm:p-7">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Email address</span>
            <input className="input" type="email" autoComplete="email" placeholder="Your account email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {studentEmail && <OutlookNotice what="reset code" />}
          {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl py-3.5" disabled={busy || !normalizedEmail}>{busy ? "Sending…" : "Send reset code"}</button>
        </form>
      ) : (
        <form onSubmit={reset} className="card space-y-4 rounded-[1.6rem] border border-line/80 bg-[var(--surface)] p-5 sm:p-7">
          {message && <p role="status" className="rounded-xl bg-brand/5 px-4 py-3 text-sm text-brand">{message}</p>}
          {studentEmail && <OutlookNotice what="reset code" showButton />}
          <input className="input text-center text-lg tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" aria-label="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
          <span className="relative block">
            <input className="input pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          <PasswordChecklist password={password} />
          <input className="input" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} maxLength={72} required />
          {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl py-3.5" disabled={busy || code.length !== 6}>{busy ? "Updating…" : "Update password"}</button>
          <button type="button" className="btn-ghost w-full" disabled={busy || countdown > 0} onClick={() => sendCode()}>
            {countdown > 0 ? `Resend available in ${countdown}s` : "Resend code"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink/65"><Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  );
}
