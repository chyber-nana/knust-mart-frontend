import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, Store } from "lucide-react";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout";
import { useToast } from "../components/Toast";

const STUDENT_DOMAINS = ["@st.knust.edu.gh", "@idl.knust.edu.gh"];

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [accountType, setAccountType] = useState<"student" | "external">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMessage("");
    const strongPassword = password.length >= 8
      && new TextEncoder().encode(password).length <= 72
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);
    if (!strongPassword) {
      setErr("Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const studentEmail = STUDENT_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));
    if (accountType === "student" && !studentEmail) {
      setErr("Student accounts need an @st.knust.edu.gh or @idl.knust.edu.gh email.");
      return;
    }
    if (accountType === "external" && studentEmail) {
      setErr("Choose Student account for a KNUST student email.");
      return;
    }

    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: { full_name: fullName.trim(), email: normalizedEmail, password, confirm_password: confirmPassword, account_type: accountType, store_name: storeName.trim() || null },
      });
      toast("Account created", accountType === "student" ? "Check your student email for the verification code." : "Check your email for the verification link.");
      if (accountType === "student") {
        nav(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
      } else {
        setMessage("Check your email for a verification link. It will sign you in when you confirm your address.");
      }
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-ink/65">Join the KNUST student marketplace.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 rounded-[1.6rem] border border-line/80 bg-[var(--surface)] p-5 shadow-[0_16px_45px_rgb(48_43_31/.08)] sm:p-7">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-paper p-1.5" role="group" aria-label="Account type">
          <button type="button" onClick={() => setAccountType("student")} aria-pressed={accountType === "student"} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition ${accountType === "student" ? "bg-brand text-white shadow-md shadow-brand/20" : "text-ink/65 hover:bg-white/70 hover:text-brand"}`}>
            <GraduationCap size={18} aria-hidden="true" /> KNUST student
          </button>
          <button type="button" onClick={() => setAccountType("external")} aria-pressed={accountType === "external"} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition ${accountType === "external" ? "bg-brand text-white shadow-md shadow-brand/20" : "text-ink/65 hover:bg-white/70 hover:text-brand"}`}>
            <Store size={17} aria-hidden="true" /> External vendor
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Full name</span>
          <input className="input" autoComplete="name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">{accountType === "student" ? "KNUST email address" : "Business email address"}</span>
          <input className="input" type="email" autoComplete="email" placeholder={accountType === "student" ? "you@st.knust.edu.gh" : "you@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {accountType === "student"
          ? <p className="rounded-xl bg-brand/5 px-3.5 py-3 text-xs leading-5 text-ink/65">Use your @st.knust.edu.gh or @idl.knust.edu.gh address. We’ll email a 6-digit code.</p>
          : <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Store name (optional)</span>
            <span className="relative block"><Store size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input className="input pl-11" placeholder="Store name (optional)" value={storeName} onChange={(e) => setStoreName(e.target.value)} maxLength={80} />
            </span>
          </label>}

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Password</span>
          <span className="relative block">
            <input className="input pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          <span className="block text-xs leading-5 text-ink/60">At least 8 characters with uppercase and lowercase letters, a number, and a symbol.</span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Confirm password</span>
          <span className="relative block">
            <input className="input pr-12" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} maxLength={72} required />
            <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword((shown) => !shown)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
        {message && <p role="status" className="rounded-xl bg-brand/5 px-4 py-3 text-sm text-brand">{message}</p>}
        <button className="btn-primary w-full rounded-xl py-3.5 shadow-lg shadow-brand/15" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/65">Already registered? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
