import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";

const STUDENT_DOMAINS = ["@st.knust.edu.gh", "@idl.knust.edu.gh"];

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [accountType, setAccountType] = useState<"student" | "external">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMessage("");
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
        body: { full_name: fullName.trim(), email: normalizedEmail, password, account_type: accountType, store_name: storeName.trim() || null },
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
    <div className="mx-auto mt-10 max-w-md px-4">
      <h1 className="font-display text-2xl font-bold text-brand">Create your account</h1>
      <p className="mb-5 text-sm text-ink/70">Join the KNUST student marketplace.</p>
      <form onSubmit={submit} className="card space-y-3 p-5">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Account type">
          <button type="button" onClick={() => setAccountType("student")} aria-pressed={accountType === "student"} className={`btn ${accountType === "student" ? "bg-brand text-white" : "border border-line bg-white"}`}>KNUST student</button>
          <button type="button" onClick={() => setAccountType("external")} aria-pressed={accountType === "external"} className={`btn ${accountType === "external" ? "bg-brand text-white" : "border border-line bg-white"}`}>External vendor</button>
        </div>
        <input className="input" autoComplete="name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required />
        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink/70">{accountType === "student" ? "KNUST email address" : "Business email address"}</span>
          <input className="input" type="email" autoComplete="email" placeholder={accountType === "student" ? "you@st.knust.edu.gh" : "you@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {accountType === "student"
          ? <p className="text-xs text-ink/60">Use your @st.knust.edu.gh or @idl.knust.edu.gh address. We’ll email a 6-digit code.</p>
          : <input className="input" placeholder="Store name (optional)" value={storeName} onChange={(e) => setStoreName(e.target.value)} maxLength={80} />}
        <input className="input" type="password" autoComplete="new-password" placeholder="Password (at least 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        {message && <p role="status" className="text-sm text-brand">{message}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-ink/70">Already registered? <Link to="/login" className="font-semibold text-brand">Sign in</Link></p>
    </div>
  );
}
