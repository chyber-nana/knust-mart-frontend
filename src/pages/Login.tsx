import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../auth";
import AuthLayout from "../components/AuthLayout";
import { useToast } from "../components/Toast";

export default function Login() {
  const { me, login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (me) return <Navigate to="/" replace />;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const appealOnly = await login(email, password);
      if (!appealOnly) toast("Signed in", "Welcome back to KNUST Mart.");
      nav(appealOnly ? "/appeals" : (location.state as { from?: string } | null)?.from ?? "/");
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <AuthLayout>
      <div className="mb-7">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand"><LockKeyhole size={23} /></div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
      </div>
      <form onSubmit={submit} className="card space-y-5 rounded-[1.6rem] border border-line/80 bg-[var(--surface)] p-5 shadow-[0_16px_45px_rgb(48_43_31/.08)] sm:p-7">
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Email address</span>
          <span className="relative block">
            <Mail size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input pl-11" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </span>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Password</span>
          <span className="relative block">
            <LockKeyhole size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input pl-11 pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-paper hover:text-brand">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full rounded-xl py-3.5 shadow-lg shadow-brand/15" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <span aria-hidden>→</span></button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/65">New around here? <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link></p>
      <Link to="/" className="mt-4 block text-center text-xs text-ink/45 transition hover:text-brand lg:hidden">Continue browsing without signing in</Link>
    </AuthLayout>
  );
}
