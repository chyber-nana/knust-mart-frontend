import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { BASE } from "./api";
import { useAuth } from "./auth";

export interface RealtimeDM {
  id: number;
  sender_id: string;
  receiver_id: string;
  kind: string;
  body: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface RealtimeNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export interface RealtimeMessage {
  id: number;
  product_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  sent_at: string;
}

export type RealtimeEvent =
  | { type: "notification"; item: RealtimeNotification }
  | { type: "message"; message: RealtimeMessage }
  | { type: "dm"; message: RealtimeDM };

type Listener = (event: RealtimeEvent) => void;

const RealtimeCtx = createContext<(listener: Listener) => () => void>(
  () => () => undefined,
);

async function readStream(
  path: string,
  onEvent: Listener,
  signal: AbortSignal,
) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const response = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    signal,
  });
  if (!response.ok || !response.body)
    throw new Error("Live updates unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      try {
        const payload = JSON.parse(dataLine.slice(5).trim()) as RealtimeEvent;
        if (payload?.type) onEvent(payload);
      } catch {
        /* ignore malformed keepalives */
      }
    }
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const listeners = useRef(new Set<Listener>());

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!me) return;
    const controller = new AbortController();
    let retry = 0;
    let timer = 0;
    const emit: Listener = (event) => {
      listeners.current.forEach((listener) => listener(event));
    };
    const connect = async () => {
      try {
        await readStream("/notifications/stream", emit, controller.signal);
        retry = 0;
      } catch (error) {
        if (controller.signal.aborted) return;
        retry = Math.min(retry + 1, 6);
      }
      if (!controller.signal.aborted) {
        timer = window.setTimeout(
          () => {
            void connect();
          },
          800 * (retry + 1),
        );
      }
    };
    void connect();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [me?.id]);

  return (
    <RealtimeCtx.Provider value={subscribe}>{children}</RealtimeCtx.Provider>
  );
}

export function useRealtime(listener: Listener) {
  const subscribe = useContext(RealtimeCtx);
  const stable = useRef(listener);
  stable.current = listener;
  useEffect(() => subscribe((event) => stable.current(event)), [subscribe]);
}
