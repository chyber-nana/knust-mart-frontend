import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

interface BadgeUser { id: string; name: string; email: string; badges: string[]; verified_student: boolean }
interface BadgeResponse { available_badges: Record<string, string>; users: BadgeUser[] }

export default function AdminBadges() {
  const { me } = useAuth();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<BadgeResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [customBadge, setCustomBadge] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (term = query) => {
    try {
      const result = await api<BadgeResponse>(`/vendors/admin/badges/users${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`);
      setData(result);
      setSelected(Object.fromEntries(result.users.map((user) => [user.id, user.badges])));
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  useEffect(() => {
    if (me?.is_admin) void load("");
  }, [me?.is_admin]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    void load();
  };

  const save = async (user: BadgeUser) => {
    setBusy(user.id);
    setError("");
    setMessage("");
    try {
      await api(`/vendors/admin/badges/users/${user.id}`, {
        method: "PUT",
        body: { badges: selected[user.id] ?? [] },
      });
      setMessage(`Badges updated for ${user.name}.`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  };

  const addCustomBadge = (user: BadgeUser) => {
    const label = (customBadge[user.id] ?? "").trim();
    const key = `custom:${label}`;
    if (!label || label.length > 33 || (selected[user.id] ?? []).includes(key)) return;
    setSelected((current) => ({ ...current, [user.id]: [...(current[user.id] ?? []), key] }));
    setCustomBadge((current) => ({ ...current, [user.id]: "" }));
  };

  if (!me?.is_admin) return <Navigate to="/" replace />;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold">User badges</h1>
        <p className="mt-1 text-sm text-ink/60">Assign or revoke badges. Verified Student, Top Rated, Trusted Vendor, and Fast Responder are also awarded automatically when eligible.</p>
      </header>
      <form onSubmit={search} className="flex gap-2">
        <input className="input min-w-0 flex-1" aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, store, or email" />
        <button className="btn-primary shrink-0" type="submit">Search</button>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-brand">{message}</p>}
      <div className="space-y-3">
        {data?.users.map((user) => (
          <section key={user.id} className="card space-y-3 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div><h2 className="text-sm font-semibold">{user.name}</h2><p className="text-xs text-ink/55">{user.email}</p></div>
              {user.verified_student && <span className="text-xs text-ink/55">Student account confirmed</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries({
                ...data.available_badges,
                ...Object.fromEntries((selected[user.id] ?? [])
                  .filter((badge) => badge.startsWith("custom:"))
                  .map((badge) => [badge, badge.slice(7)])),
              }).map(([key, label]) => {
                const checked = (selected[user.id] ?? []).includes(key);
                return (
                  <label key={key} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                    <input type="checkbox" checked={checked} disabled={!checked && (selected[user.id] ?? []).length >= 6} onChange={() => setSelected((current) => ({
                      ...current,
                      [user.id]: checked
                        ? (current[user.id] ?? []).filter((badge) => badge !== key)
                        : [...(current[user.id] ?? []), key],
                    }))} />
                    {label}{key === "pioneer" ? " · automatic for first 10 accounts" : ""}
                  </label>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="input min-w-0 flex-1" aria-label={`Custom badge for ${user.name}`} value={customBadge[user.id] ?? ""} maxLength={33} onChange={(event) => setCustomBadge((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="Custom badge label" />
              <button type="button" className="btn-ghost" disabled={!customBadge[user.id]?.trim() || (selected[user.id] ?? []).length >= 6} onClick={() => addCustomBadge(user)}>Add custom badge</button>
            </div>
            <button type="button" className="btn-ghost" disabled={busy === user.id} onClick={() => void save(user)}>
              {busy === user.id ? "Saving…" : "Save badges"}
            </button>
          </section>
        ))}
        {data && data.users.length === 0 && <p className="card p-5 text-sm text-ink/60">No matching users.</p>}
      </div>
    </div>
  );
}
