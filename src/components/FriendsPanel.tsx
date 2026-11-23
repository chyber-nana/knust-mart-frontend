import { ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useRealtime } from "../realtime";

interface Person { id: string; username: string; name: string; request_id?: number }
interface Lists { friends: Person[]; incoming: Person[]; outgoing: Person[] }
interface Hit extends Person { relation: "none" | "friends" | "pending_out" | "pending_in" }
interface Dm { friend_id: string; last_message: string | null; unread_count: number }

const primary = "rounded-lg bg-brand px-3 py-1 text-sm font-semibold text-white";
const ghost = "rounded-lg border px-3 py-1 text-sm";

const Row = ({ p, sub, children }: { p: Person; sub?: string; children: ReactNode }) => (
  <li className="card flex items-center gap-2 p-3">
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold">@{p.username}</p>
      <p className="truncate text-xs text-ink/60">{sub ?? p.name}</p>
    </div>
    {children}
  </li>
);

export default function FriendsPanel() {
  const [lists, setLists] = useState<Lists>({ friends: [], incoming: [], outgoing: [] });
  const [dms, setDms] = useState<Record<string, Dm>>({});
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, d] = await Promise.all([api<Lists>("/friends"), api<Dm[]>("/dm/threads")]);
      setLists(l);
      setDms(Object.fromEntries(d.map((x) => [x.friend_id, x])));
    } catch (x) { setErr((x as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    window.addEventListener("messages:read", load);
    return () => window.removeEventListener("messages:read", load);
  }, [load]);
  useRealtime((event) => { if (event.type === "dm") void load(); });

  useEffect(() => {
    const term = q.trim().replace(/^@/, "");
    if (term.length < 2) { setHits([]); return; }
    const t = window.setTimeout(async () => {
      try { setHits(await api<Hit[]>(`/friends/search?q=${encodeURIComponent(term)}`)); } catch { setHits([]); }
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, lists]);

  const act = async (path: string, method = "POST", body?: unknown) => {
    try { await api(path, { method, body }); setErr(""); await load(); }
    catch (x) { setErr((x as Error).message); }
  };

  return (
    <div className="space-y-5">
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <div>
        <input value={q} onChange={(e) => setQ(e.target.value.toLowerCase())} placeholder="Find friends by @username"
          className="w-full rounded-xl border bg-transparent px-3 py-2 outline-none" />
        {hits.length > 0 && <ul className="mt-2 space-y-2">{hits.map((h) => (
          <Row key={h.id} p={h}>
            {h.relation === "none" && <button className={primary} onClick={() => act("/friends/request", "POST", { username: h.username })}>Add</button>}
            {h.relation === "pending_out" && <span className="text-xs text-ink/60">Requested</span>}
            {h.relation === "pending_in" && <button className={primary} onClick={() => act("/friends/request", "POST", { username: h.username })}>Accept</button>}
            {h.relation === "friends" && <span className="text-xs text-ink/60">Friends</span>}
          </Row>))}</ul>}
      </div>

      {lists.incoming.length > 0 && <section>
        <h2 className="mb-2 text-sm font-semibold text-ink/70">Requests ({lists.incoming.length})</h2>
        <ul className="space-y-2">{lists.incoming.map((p) => (
          <Row key={p.id} p={p}>
            <button className={primary} onClick={() => act(`/friends/${p.request_id}/accept`)}>Accept</button>
            <button className={ghost} onClick={() => act(`/friends/${p.request_id}/decline`)}>Decline</button>
          </Row>))}</ul>
      </section>}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink/70">Friends ({lists.friends.length})</h2>
        {lists.friends.length === 0 ? <p className="card p-4 text-sm text-ink/70">No friends yet. Search a username above.</p> : (
          <ul className="space-y-2">{lists.friends.map((p) => (
            <Row key={p.id} p={p} sub={dms[p.id]?.last_message ?? p.name}>
              <Link to={`/inbox/dm/${p.id}`} className={primary}>
                Message{dms[p.id]?.unread_count ? ` (${dms[p.id].unread_count})` : ""}
              </Link>
              <button className={ghost} onClick={() => window.confirm(`Unfriend @${p.username}?`) && act(`/friends/${p.id}`, "DELETE")}>Unfriend</button>
              <button className={ghost} onClick={() => window.confirm(`Block @${p.username}?`) && act(`/friends/block/${p.id}`)}>Block</button>
            </Row>))}</ul>)}
      </section>

      {lists.outgoing.length > 0 && <section>
        <h2 className="mb-2 text-sm font-semibold text-ink/70">Sent</h2>
        <ul className="space-y-2">{lists.outgoing.map((p) => (
          <Row key={p.id} p={p}><button className={ghost} onClick={() => act(`/friends/${p.request_id}/decline`)}>Cancel</button></Row>))}</ul>
      </section>}
    </div>
  );
}