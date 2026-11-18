import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useRealtime } from "../realtime";

export default function InboxBadge() {
  const { me } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    if (!me) { setCount(0); return; }
    api<{ count: number }>("/messages/unread-count").then((r) => setCount(r.count)).catch(() => undefined);
  }, [me?.id]);
  useEffect(() => { load(); }, [load, location.pathname]);
  useEffect(() => {
    window.addEventListener("messages:read", load);
    return () => window.removeEventListener("messages:read", load);
  }, [load]);
  useRealtime((event) => { if (event.type === "message" && event.message.receiver_id === me?.id) load(); });
  if (count < 1) return null;
  return <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">{count > 99 ? "99+" : count}</span>;
}
