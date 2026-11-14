export const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: ["Bearer", token].join(" ") } : {};
}

async function responseError(res: Response): Promise<Error> {
  const error = await res.json().catch(() => ({}));
  return Object.assign(new Error(typeof error.detail === "string" ? error.detail : "Something went wrong. Try again."), { status: res.status });
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw await responseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiForm<T>(path: string, form: FormData, method = "POST"): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE + path, {
    method,
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw await responseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Delivery { id: string; role: "buyer" | "courier" | "seller"; status: string; fulfillment_type: "courier" | "pickup"; pickup: string; dropoff: string; fee: number; product_id?: string; product_title?: string; vendor_id?: string; vendor_name?: string; buyer_id?: string; reviewed?: boolean }
export interface Job { id: string; pickup: string; dropoff: string; fee: number; available_at: string | null; product_title: string }
export const HALLS = ["Unity", "Independence", "Evandy", "Republic", "Queen Elizabeth II", "Africa", "Off-Campus Commercial Hub", "Main Library", "Student Union Building"];

export const mediaUrl = (u?: string | null) => (u ? (u.startsWith("http") ? u : BASE + u) : "");
export async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(BASE + "/uploads", {
    method: "POST",
    headers: authHeaders(localStorage.getItem("token")),
    body: fd,
  });
  if (!res.ok) throw await responseError(res);
  return (await res.json()).url;
}

export interface Seller { id: string; name: string; user_type: string }
export interface Card { id: string; title: string; price: number; category: string; condition: string | null; hall_location: string | null; image: string | null; is_promoted: boolean; seller: Seller }
export interface Meta { categories: string[]; conditions: string[]; locations: string[]; fees: Record<string, { listing: number; promotion: number }>; delivery_fee: number }
export interface ChatMessage { id: number; product_id: string; sender_id: string; receiver_id: string; message: string; sent_at: string }
export interface ChatThread { product_id: string; product_title: string; counterpart_id: string; counterpart_name: string; last_message: string; sent_at: string; unread_count: number }
export interface Payout { delivery_id: string; product_title: string; amount: number; status: string; created_at: string }
