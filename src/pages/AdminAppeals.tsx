import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

interface Appeal {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
}

export default function AdminAppeals() {
  const { me } = useAuth();
  const [rows, setRows] = useState<Appeal[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try { setRows(await api<Appeal[]>("/admin/appeals")); }
    catch (x) { setErr((x as Error).message); }
  };
  useEffect(() => { if (me?.is_admin) load(); }, [me?.is_admin]);

  const review = async (appeal: Appeal, status: "approved" | "rejected") => {
    const rejection_reason = reasons[appeal.id]?.trim();
    if (status === "rejected" && !rejection_reason) {
      setErr("Add a reason before rejecting an appeal.");
      return;
    }
    setBusy(appeal.id);
    setErr("");
    try {
      await api(`/admin/appeals/${appeal.id}/review`, { method: "POST", body: { status, rejection_reason } });
      await load();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (!me?.is_admin) return <Navigate to="/" replace />;
  const pending = rows.filter((appeal) => appeal.status === "pending");
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Account appeals</h1>
      <p className="mb-5 text-sm text-ink/70">Review suspension appeals. Approval restores account access and leaves courier mode off.</p>
      {err && <p role="alert" className="mb-3 text-sm text-red-700">{err}</p>}
      {pending.length === 0 ? <p className="card p-5 text-sm text-ink/70">No pending appeals.</p> : <ul className="space-y-4">
        {pending.map((appeal) => <li key={appeal.id} className="card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold">{appeal.full_name}</p><p className="text-sm text-ink/60">{appeal.email}</p></div>
            <time className="text-xs text-ink/50">{new Date(appeal.created_at).toLocaleString()}</time>
          </div>
          <p className="whitespace-pre-line text-sm">{appeal.message}</p>
          <textarea className="input min-h-20" placeholder="Reason shown to the user if rejected" value={reasons[appeal.id] ?? ""} onChange={(e) => setReasons({ ...reasons, [appeal.id]: e.target.value })} maxLength={1000} />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy === appeal.id} onClick={() => review(appeal, "approved")}>Approve</button>
            <button className="btn-danger" disabled={busy === appeal.id} onClick={() => review(appeal, "rejected")}>Reject</button>
          </div>
        </li>)}
      </ul>}
    </div>
  );
}
