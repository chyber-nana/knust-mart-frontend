import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useRealtime } from "../realtime";

/** Red dot on the Orders tab while any of the user's orders are still in progress. */
export default function OrdersDot() {
  const { me } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    if (!me) { setCount(0); return; }
    api<{ count: number }>("/deliveries/active-count").then((r) => setCount(r.count)).catch(() => undefined);
  }, [me?.id]);
  useEffect(() => { load(); }, [load, location.pathname]);
  useEffect(() => { const t = window.setInterval(load, 20000); return () => window.clearInterval(t); }, [load]);
  useRealtime(() => load());
  if (count < 1) return null;
  return <span aria-label={`${count} orders in progress`} className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">{count > 9 ? "9+" : count}</span>;
}
