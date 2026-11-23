import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, DirectMessage } from "../api";
import { useAuth } from "../auth";
import { useRealtime } from "../realtime";

interface Data { friend: { id: string; username: string; name: string }; messages: DirectMessage[] }

export default function DirectChat() {
  const { friendId = "" } = useParams();
  const { me } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try { setData(await api<Data>(`/dm/with/${friendId}`)); setErr(""); }
    catch (x) { setErr((x as Error).message); }
  }, [friendId]);
  const markRead = useCallback(() => {
    api(`/dm/with/${friendId}/read`, { method: "POST" })
      .then(() => window.dispatchEvent(new Event("messages:read"))).catch(() => undefined);
  }, [friendId]);

  useEffect(() => { void load().then(() => window.dispatchEvent(new Event("messages:read"))); }, [load]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const visible = (data?.messages ?? []).filter((m) => !m.expires_at || new Date(m.expires_at).getTime() > now);
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [visible.length]);

  useRealtime((event) => {
    if (event.type !== "dm") return;
    const m = event.message;
    const other = m.sender_id === me?.id ? m.receiver_id : m.sender_id;
    if (other !== friendId) return;
    if (m.sender_id !== me?.id) markRead();
    setData((cur) => cur && !cur.messages.some((r) => r.id === m.id) ? { ...cur, messages: [...cur.messages, m] } : cur);
  });

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setDraft(""); setErr("");
    try {
      const sent = await api<DirectMessage>(`/dm/with/${friendId}`, { method: "POST", body: { message } });
      setData((cur) => cur && !cur.messages.some((r) => r.id === sent.id) ? { ...cur, messages: [...cur.messages, sent] } : cur);
    } catch (x) { setErr((x as Error).message); setDraft(message); }
  };

  const left = (m: DirectMessage) => m.expires_at
    ? `disappears in ${Math.max(1, Math.ceil((new Date(m.expires_at).getTime() - now) / 3600000))}h` : "";

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/inbox?tab=friends" className="mb-3 inline-block text-sm font-semibold text-brand">← Friends</Link>
      <div className="card overflow-hidden">
        <header className="border-b border-line p-4">
          <p className="font-display text-lg font-bold">@{data?.friend.username ?? "…"}</p>
          <p className="text-xs text-ink/60">{data?.friend.name} · Messages disappear 24 hours after they're sent.</p>
        </header>
        <div ref={boxRef} className="max-h-[55vh] min-h-48 space-y-3 overflow-y-auto p-4">
          {visible.map((m) => {
            const own = m.sender_id === me?.id;
            return <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg border px-3 py-2 ${own ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                <time className={`mt-1 block text-right text-[10px] ${own ? "text-white/70" : "text-ink/50"}`}>
                  {new Date(m.created_at).toLocaleTimeString()} {left(m) && `· ${left(m)}`}
                </time>
              </div>
            </div>;
          })}
          {data && visible.length === 0 && <p className="py-12 text-center text-sm text-ink/60">No messages yet. Say hi!</p>}
        </div>
        {err && <p role="alert" className="border-t border-line px-4 py-2 text-sm text-red-700">{err}</p>}
        <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
          <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" maxLength={2000} required />
          <button className="btn-primary" disabled={!draft.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}