import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

export default function UsernamePrompt() {
  const { me, refresh } = useAuth();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const clean = name.trim().replace(/^@/, "").toLowerCase();

  useEffect(() => {
    setStatus(null);
    if (clean.length < 3) return;
    const t = window.setTimeout(async () => {
      try {
        const r = await api<{ available: boolean; reason: string | null }>(
          `/auth/username-available?name=${encodeURIComponent(clean)}`);
        setStatus(r.available ? { ok: true, msg: "Available ✓" } : { ok: false, msg: r.reason ?? "Not available" });
      } catch { setStatus(null); }
    }, 400);
    return () => window.clearTimeout(t);
  }, [clean]);

  if (!me || me.username) return null;

  const save = async () => {
    setSaving(true);
    try {
      await api("/auth/username", { method: "POST", body: { username: clean } });
      await refresh();
    } catch (e) { setStatus({ ok: false, msg: (e as Error).message }); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="card w-full max-w-sm p-5">
        <h2 className="font-display text-xl font-bold">Pick your username</h2>
        <p className="mt-1 text-sm text-ink/60">Lowercase letters, numbers, _ and . only. You can only set it once.</p>
        <div className="mt-3 flex items-center gap-1 rounded-xl border px-3 py-2">
          <span className="text-ink/50">@</span>
          <input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))} maxLength={21}
            className="w-full bg-transparent outline-none" placeholder="kwame_k" autoFocus />
        </div>
        {status && <p className={`mt-2 text-sm ${status.ok ? "text-green-700" : "text-red-700"}`}>{status.msg}</p>}
        <button onClick={save} disabled={!status?.ok || saving}
          className="mt-4 w-full rounded-xl bg-brand py-2 font-semibold text-white disabled:opacity-50">
          {saving ? "Saving…" : "Claim username"}
        </button>
      </div>
    </div>
  );
}