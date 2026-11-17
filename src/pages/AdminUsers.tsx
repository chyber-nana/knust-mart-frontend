import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_banned: boolean;
}

export default function AdminUsers() {
  const { me } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (term = query) => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ users: AdminUser[] }>(
        `/admin/users${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`,
      );
      setUsers(result.users);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me?.is_admin) void load("");
  }, [me?.is_admin]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    void load();
  };

  const anonymize = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Anonymize ${user.name} (${user.email})? Their profile and contact details will be removed and login disabled. Transaction and chat history will remain associated with an anonymized account.`,
    );
    if (!confirmed) return;

    setBusy(user.id);
    setError("");
    setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage(`${user.name} was anonymized. Historical orders and chats were retained.`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (!me?.is_admin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Account management</h1>
        <p className="mt-1 text-sm text-ink/60">
          Anonymization removes profile details and disables login while retaining marketplace history for transaction integrity. Accounts with active orders must be resolved first. It does not erase personal information users may have included in messages or reviews.
        </p>
      </header>

      <form onSubmit={search} className="flex gap-2">
        <input
          className="input min-w-0 flex-1"
          aria-label="Search users"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, store, or email"
        />
        <button className="btn-primary shrink-0" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-brand">{message}</p>}

      <div className="space-y-3">
        {users.map((user) => (
          <section key={user.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{user.name}</h2>
              <p className="break-all text-xs text-ink/55">{user.email}</p>
              {user.is_banned && <span className="mt-1 inline-block text-xs text-ink/55">Suspended</span>}
            </div>
            <button
              type="button"
              className="btn-danger shrink-0"
              disabled={busy === user.id || user.is_admin || user.id === me.id}
              title={user.is_admin ? "Admin accounts cannot be anonymized here." : user.id === me.id ? "You cannot anonymize your own account." : undefined}
              onClick={() => void anonymize(user)}
            >
              {busy === user.id ? "Anonymizing…" : "Anonymize account"}
            </button>
          </section>
        ))}
        {!loading && users.length === 0 && <p className="card p-5 text-sm text-ink/60">No matching users.</p>}
      </div>
    </div>
  );
}
