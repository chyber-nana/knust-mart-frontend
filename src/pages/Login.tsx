import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";

export default function Login() {
  const { me, login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="mx-auto flex min-h-[76vh] max-w-sm items-center px-1 py-8">
      <div className="w-full">
        <div className="mb-5"><div className="mb-3 grid h-11 w-11 place-items-center rounded-[30%] bg-brand font-display text-lg font-bold text-white">K</div><h1 className="font-display text-2xl font-bold">Sign in</h1></div>
        <form onSubmit={submit} className="card space-y-4 rounded-2xl p-5 sm:p-6">
          <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Email address</span><input className="input" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Password</span><input className="input" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full rounded-xl" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <span aria-hidden>→</span></button>
        </form>
        <p className="mt-4 text-center text-sm text-ink/60">New around here? <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link></p>
        <Link to="/" className="mt-5 block text-center text-xs text-ink/45 hover:text-brand">Continue browsing without signing in</Link>
      </div>
    </div>
  );
}
