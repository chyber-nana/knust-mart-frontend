import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";

export default function Verify() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { completeAuth } = useAuth();
  const toast = useToast();
  const token = params.get("token");
  const verificationStarted = useRef(false);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    let active = true;
    api<{ access_token: string }>("/auth/verify-link", { method: "POST", body: { verification_token: token } })
      .then(async (result) => {
        await completeAuth(result.access_token);
        if (active) {
          toast("Email verified", "Your KNUST Mart account is ready.");
          nav("/", { replace: true });
        }
      })
      .catch((x) => { if (active) setErr((x as Error).message); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const result = await api<{ access_token: string }>("/auth/verify", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), otp_code: code },
      });
      await completeAuth(result.access_token);
      toast("Email verified", "Your KNUST Mart account is ready.");
      nav("/", { replace: true });
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setErr("");
    setMessage("");
    try {
      await api("/auth/resend", { method: "POST", body: { email: email.trim().toLowerCase() } });
      setMessage("If the account exists, a new verification code was sent.");
      setCountdown(60);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (token) {
    return <div className="mx-auto mt-16 max-w-sm px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-brand">Confirming your email</h1>
      {!err && <p className="mt-3 text-sm text-ink/70">Please wait while we verify your address and sign you in.</p>}
      {err && <p role="alert" className="mt-3 text-sm text-red-700">{err} <Link className="font-semibold text-brand" to="/login">Sign in</Link></p>}
    </div>;
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-bold text-brand">Verify your student email</h1>
      <p className="mb-5 text-sm text-ink/70">Enter the 6-digit code we sent to your KNUST email. It expires in 10 minutes.</p>
      <form onSubmit={verify} className="card space-y-3 p-5">
        <input className="input" type="email" autoComplete="email" placeholder="KNUST email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input text-center text-lg tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        {message && <p role="status" className="text-sm text-brand">{message}</p>}
        <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify and sign in"}</button>
        <button type="button" className="btn-ghost w-full" disabled={busy || countdown > 0 || !email} onClick={resend}>
          {countdown > 0 ? `Resend available in ${countdown}s` : "Resend code"}
        </button>
      </form>
    </div>
  );
}
