import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ChatMessage } from "../api";
import { useAuth } from "../auth";

interface ThreadData {
  product: { id: string; title: string };
  counterpart: { id: string; name: string };
  messages: ChatMessage[];
}

export default function Chat() {
  const { productId = "", counterpartId = "" } = useParams();
  const { me } = useAuth();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setThread(await api<ThreadData>(`/messages/${productId}/${counterpartId}`));
      setErr("");
    } catch (x) { setErr((x as Error).message); }
  }, [productId, counterpartId]);
  useEffect(() => { load(); const timer = window.setInterval(load, 4000); return () => window.clearInterval(timer); }, [load]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setBusy(true);
    setErr("");
    try {
      await api("/messages", { method: "POST", body: { product_id: productId, receiver_id: counterpartId, message } });
      setDraft("");
      await load();
    } catch (x) {
      setErr((x as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/inbox" className="mb-3 inline-block text-sm font-semibold text-brand">← Inbox</Link>
      <div className="card overflow-hidden">
        <header className="border-b border-line p-4">
          <p className="font-display text-lg font-bold">{thread?.counterpart.name ?? "Conversation"}</p>
          {thread && <Link to={`/products/${thread.product.id}`} className="text-sm text-brand hover:underline">{thread.product.title}</Link>}
        </header>
        <div className="border-b border-line bg-paper p-3">
          <p className="text-sm font-semibold">Plan a safe public meetup</p>
          <p className="mt-1 text-xs text-ink/70">Meet in a busy, well-lit campus place. Suggested spots: Main Library or Student Union Building. Inspect the item before paying.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setDraft("Could we meet at the Main Library?")}>Suggest Main Library</button>
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setDraft("Could we meet at the Student Union Building?")}>Suggest Student Union Building</button>
          </div>
        </div>
        <div className="max-h-[55vh] min-h-48 space-y-3 overflow-y-auto p-4">
          {thread?.messages.map((message) => {
            const own = message.sender_id === me?.id;
            return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg border px-3 py-2 ${own ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{message.message}</p>
                <time className={`mt-1 block text-right text-[10px] ${own ? "text-white/70" : "text-ink/50"}`}>{new Date(message.sent_at).toLocaleTimeString()}</time>
              </div>
            </div>;
          })}
          {thread?.messages.length === 0 && <p className="py-12 text-center text-sm text-ink/60">No messages yet.</p>}
        </div>
        {err && <p role="alert" className="border-t border-line px-4 py-2 text-sm text-red-700">{err}</p>}
        <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
          <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" maxLength={2000} required />
          <button className="btn-primary" disabled={busy || !draft.trim()}>{busy ? "Sending…" : "Send"}</button>
        </form>
      </div>
    </div>
  );
}
