import { useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "./Toast";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

interface NotificationResponse {
  unread_count: number;
  items: NotificationItem[];
}

export default function NotificationCenter() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const centerRef = useRef<HTMLDivElement>(null);
  const lastSeenId = useRef<number | null>(null);
  const lastSeenUser = useRef<string | null>(null);

  useEffect(() => {
    if (!me) {
      setItems([]);
      setUnreadCount(0);
      lastSeenId.current = null;
      lastSeenUser.current = null;
      return;
    }
    if (lastSeenUser.current !== me.id) {
      lastSeenUser.current = me.id;
      lastSeenId.current = null;
    }
    let active = true;
    const load = async () => {
      try {
        const response = await api<NotificationResponse>("/notifications");
        if (!active) return;
        if (lastSeenId.current !== null) {
          const newest = response.items.find((item) => item.id > lastSeenId.current!);
          const orderPage = /^\/orders\/[^/]+$/.test(location.pathname);
          const actionAlreadyVisible = (orderPage && ["order_requested", "order_delivered"].includes(newest?.type ?? ""))
            || (location.pathname === "/courier" && ["order_delivered", "delivery_available"].includes(newest?.type ?? ""));
          if (newest && !actionAlreadyVisible) toast(newest.title, newest.body);
        }
        lastSeenId.current = Math.max(lastSeenId.current ?? 0, ...response.items.map((item) => item.id));
        setItems(response.items);
        setUnreadCount(response.unread_count);
        setError("");
      } catch (x) {
        if (active) setError((x as Error).message);
      }
    };
    void load();
    const timer = window.setInterval(load, 12000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [me?.id, location.pathname, toast]);

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", clickOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const markAllRead = async () => {
    setError("");
    try {
      await api("/notifications/read-all", { method: "POST" });
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => item.read_at ? item : { ...item, read_at: now }));
      setUnreadCount(0);
    } catch (x) {
      setError((x as Error).message);
    }
  };

  const selectNotification = async (item: NotificationItem) => {
    try {
      if (!item.read_at) {
        await api(`/notifications/${item.id}/read`, { method: "PATCH" });
        setItems((current) => current.map((row) => row.id === item.id ? { ...row, read_at: new Date().toISOString() } : row));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      setOpen(false);
      if (item.link) navigate(item.link);
    } catch (x) {
      setError((x as Error).message);
    }
  };

  return (
    <div className="relative" ref={centerRef}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink/70 transition hover:text-brand"
      >
        <Bell size={17} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && <div role="dialog" aria-label="Notifications" className="fixed left-1/2 top-16 z-[60] w-[min(92vw,24rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-white shadow-xl sm:absolute sm:left-auto sm:top-[calc(100%+10px)] sm:right-0 sm:translate-x-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display font-bold">Notifications</h2>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} aria-label="Mark all notifications read" title="Mark all as read" className="grid h-8 w-8 place-items-center rounded-full text-brand hover:bg-paper"><Check size={16} /></button>}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><X size={16} /></button>
          </div>
        </div>
        {error ? <p role="alert" className="p-4 text-sm text-red-700">{error}</p>
          : items.length === 0 ? <p className="p-5 text-center text-sm text-ink/60">No notifications yet.</p>
          : <ul className="max-h-[min(65vh,28rem)] divide-y divide-line overflow-y-auto">
            {items.map((item) => <li key={item.id}>
              <button type="button" onClick={() => void selectNotification(item)} className={`w-full px-4 py-3 text-left transition hover:bg-paper ${item.read_at ? "" : "bg-brand/[.04]"}`}>
                <span className="flex items-start gap-2">
                  {!item.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-ink/70">{item.body}</span>
                    <time className="mt-1 block text-[11px] text-ink/45">{new Date(item.created_at).toLocaleString()}</time>
                  </span>
                </span>
              </button>
            </li>)}
          </ul>}
      </div>}
    </div>
  );
}
