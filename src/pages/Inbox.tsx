import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FriendsPanel from "../components/FriendsPanel";
import { api, ChatThread } from "../api";
import { useRealtime } from "../realtime";
import UsernamePrompt from "../components/UsernamePrompt";

export default function Inbox() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [unread, setUnread] = useState(0);
  const [err, setErr] = useState("");
  const [params, setParams] = useSearchParams();
const tab = params.get("tab") === "friends" ? "friends" : "chats";

  const load = useCallback(async () => {
    try {
      const [rows, count] = await Promise.all([
        api<ChatThread[]>("/messages/threads"),
        api<{ count: number }>("/messages/unread-count"),
      ]);
      setThreads(rows);
      setUnread(count.count);
      setErr("");
    } catch (x) { setErr((x as Error).message); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("messages:read", refresh);
    const timer = window.setInterval(refresh, 60000); // slow safety net; live updates arrive over the stream
    return () => { window.removeEventListener("messages:read", refresh); window.clearInterval(timer); };
  }, [load]);
  useRealtime((event) => { if (event.type === "message" || event.type === "dm") void load(); });

  return (
    <div>
      <UsernamePrompt />
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Inbox</h1><p className="text-sm text-ink/60">{unread} unread message{unread === 1 ? "" : "s"}</p></div>
      </div>
      <div className="mb-4 flex gap-2">
  {(["chats", "friends"] as const).map((t) => (
    <button key={t} onClick={() => setParams(t === "chats" ? {} : { tab: t })}
      className={`rounded-full px-4 py-1 text-sm font-semibold ${tab === t ? "bg-brand text-white" : "border"}`}>
      {t === "chats" ? "Chats" : "Friends"}
    </button>))}
</div>
{tab === "friends" ? <FriendsPanel /> : <>
      {err && <p role="alert" className="mb-3 text-sm text-red-700">{err}</p>}
      {threads.length === 0 ? <p className="card p-5 text-sm text-ink/70">No conversations yet.</p> : (
        <ul className="space-y-3">{threads.map((thread) => <li key={`${thread.product_id}:${thread.counterpart_id}`}>
          <Link to={`/chat/${thread.product_id}/${thread.counterpart_id}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-px hover:shadow-md">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{thread.product_title}</p>
              <p className="text-xs text-ink/60">{thread.counterpart_name} · {new Date(thread.sent_at).toLocaleString()}</p>
              <p className="mt-1 truncate text-sm text-ink/70">{thread.last_message}</p>
            </div>
            {thread.unread_count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand px-2 text-xs font-bold text-white">{thread.unread_count}</span>}
          </Link>
        </li>)}</ul>
      )}
      </>}
    </div>
  );
}
