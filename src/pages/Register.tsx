import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout";
import OutlookNotice from "../components/OutlookNotice";
import PasswordChecklist, { isStrongPassword } from "../components/PasswordChecklist";
import { useToast } from "../components/Toast";

const STUDENT_DOMAINS = ["@st.knust.edu.gh", "@idl.knust.edu.gh"];

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const studentEmail = STUDENT_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMessage("");
    if (!isStrongPassword(password)) {
      setErr("Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      // The server decides student vs. visitor from the email domain. Businesses are created later.
      await api("/auth/register", {
        method: "POST",
        body: { full_name: fullName.trim(), email: normalizedEmail, password, confirm_password: confirmPassword },
      });
      toast("Account created", studentEmail ? "Check your student email for the verification code." : "Check your email for the verification link.");
      if (studentEmail) {
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
        <p className="mt-2 text-sm text-ink/65">Just an email and a password. Want to sell? You can open your business after you sign in.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 rounded-[1.6rem] border border-line/80 bg-[var(--surface)] p-5 shadow-[0_16px_45px_rgb(48_43_31/.08)] sm:p-7">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Full name</span>
          <input className="input" autoComplete="name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Email address</span>
          <input className="input" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {studentEmail
          ? <OutlookNotice />
          : <p className="rounded-xl bg-brand/5 px-3.5 py-3 text-xs leading-5 text-ink/65">KNUST students: use your @st.knust.edu.gh or @idl.knust.edu.gh email. Everyone else can use any email and we’ll send a verification link.</p>}

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Password</span>
          <span className="relative block">
            <input className="input pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <PasswordChecklist password={password} />

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
