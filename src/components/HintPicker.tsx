import { useEffect, useState } from "react";
import { api } from "../api";

interface Friend { id: string; username: string; name: string }

export default function HintPicker({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ friends: Friend[] }>("/friends").then((r) => setFriends(r.friends)).catch((x) => setErr(x.message));
  }, []);

  const send = async (f: Friend) => {
    setErr("");
    try {
      await api("/dm/hints", { method: "POST", body: { friend_id: f.id, product_id: productId, note: note.trim() || null } });
      setSent((s) => [...s, f.id]);
    } catch (x) { setErr((x as Error).message); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-sm p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">🎁 Send as Hint</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl">×</button>
        </div>
        <p className="mt-1 text-sm text-ink/60">Pick a friend to buy this for you.</p>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Add a note (optional)"
          className="mt-3 w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none" />
        {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {friends === null ? <li className="text-sm text-ink/60">Loading…</li>
            : friends.length === 0 ? <li className="text-sm text-ink/70">No friends yet. Add some in Inbox → Friends.</li>
            : friends.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-xl border p-2">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">@{f.username}</p><p className="truncate text-xs text-ink/60">{f.name}</p></div>
                {sent.includes(f.id) ? <span className="text-sm font-semibold text-green-700">Sent ✓</span>
                  : <button onClick={() => send(f)} className="rounded-lg bg-brand px-3 py-1 text-sm font-semibold text-white">Send</button>}
              </li>))}
        </ul>
      </div>
    </div>
  );
}