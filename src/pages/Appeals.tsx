import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

interface Appeal {
  id: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
}

export default function Appeals() {
  const { appealOnly, loading, logout } = useAuth();
  const [rows, setRows] = useState<Appeal[]>([]);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setRows(await api<Appeal[]>("/appeals")); }
    catch (x) { setErr((x as Error).message); }
  };
  useEffect(() => { if (appealOnly) load(); }, [appealOnly]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/appeals", { method: "POST", body: { message } });
      setMessage("");
      await load();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="p-6 text-sm">Loading…</p>;
  if (!appealOnly) return <Navigate to="/login" replace />;
  const pending = rows.some((appeal) => appeal.status === "pending");

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold">Account appeal</h1><p className="text-sm text-ink/70">Your account is suspended. This limited-access page lets you submit and check your own appeal only.</p></div>
        <button className="btn-ghost" onClick={logout}>Sign out</button>
      </div>
      {!pending && <form onSubmit={submit} className="card space-y-3 p-5">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Explain why you’re appealing</span>
          <textarea className="input min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} minLength={10} maxLength={3000} required />
        </label>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit appeal"}</button>
      </form>}
      {pending && <p className="card p-4 text-sm text-ink/70">Your appeal is awaiting review. You can only have one pending appeal at a time.</p>}
      {err && pending && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Your appeal history</h2>
      {rows.length === 0 ? <p className="text-sm text-ink/60">No appeals submitted yet.</p> : <ul className="space-y-3">
        {rows.map((appeal) => <li key={appeal.id} className="card space-y-2 p-4">
          <div className="flex items-center justify-between gap-3"><span className="text-sm text-ink/60">{new Date(appeal.created_at).toLocaleString()}</span><span className="rounded-full border border-line px-2 py-0.5 text-xs font-semibold capitalize">{appeal.status}</span></div>
          <p className="whitespace-pre-line text-sm">{appeal.message}</p>
          {appeal.rejection_reason && <p className="text-sm text-red-800"><b>Review note:</b> {appeal.rejection_reason}</p>}
        </li>)}
      </ul>}
      <Link to="/" className="mt-6 inline-block text-sm font-semibold text-brand">Back to public listings</Link>
    </div>
  );
}
