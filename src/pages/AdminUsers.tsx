import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, CheckCircle2, ChevronRight, Copy, Loader2, Mail, MessageCircle, Phone, Search, X, XCircle } from "lucide-react";
import { api, mediaUrl, whatsappUrl } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";

interface AdminUser {
  id: string;
  full_name: string;
  name: string;
  email: string;
  user_type: string;
  is_verified_student: boolean;
  is_email_verified: boolean;
  is_verified: boolean;
  is_courier: boolean;
  is_banned: boolean;
  restriction: "suspended" | "banned" | null;
  is_admin: boolean;
  hostel_or_business_address: string | null;
  store_name: string | null;
  store_bio: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
  banner_url: string | null;
  store_activated_at: string | null;
  store_activation_type: string | null;
  store_suspended_at: string | null;
  store_active: boolean;
  has_business: boolean;
  created_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  business_terms_accepted_at: string | null;
  business_terms_version: string | null;
}

interface UserDetail extends AdminUser {
  badges: string[];
  pending_orders: number;
  listings: { id: string; title: string; price: number; category: string; status: string; stock: number | null; created_at: string | null }[];
  orders: { id: string; status: string; fulfillment_type: string; product_title: string; role: string; pickup: string; dropoff: string; fee: number; created_at: string | null; completed_at: string | null }[];
  payments: { id: string; purpose: string; reference: string; amount: number; currency: string; status: string; created_at: string | null; paid_at: string | null }[];
}

interface AdminList {
  stats: { users: number; businesses: number; live_businesses: number; suspended: number; banned: number };
  users: AdminUser[];
}

type Filter = "all" | "students" | "external" | "businesses" | "suspended" | "banned";
type Action = "suspend" | "ban" | "restore";
type Target = "account" | "business";
type Status = "active" | "suspended" | "banned" | "store_suspended";

interface Pending {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  typed?: string;
  run: () => Promise<void>;
}

const LIMIT = 150;
const FILTERS: [Filter, string][] = [
  ["all", "Everyone"], ["students", "Students"], ["external", "Non-students"],
  ["businesses", "Businesses"], ["suspended", "Suspended"], ["banned", "Banned"],
];
const STATUS: Record<Status, { label: string; dot: string; pill: string }> = {
  active: { label: "Active", dot: "bg-brand", pill: "bg-brand/10 text-brand" },
  suspended: { label: "Suspended", dot: "bg-gold", pill: "bg-gold/15 text-ink/80" },
  banned: { label: "Banned", dot: "bg-red-500", pill: "bg-red-50 text-red-700" },
  store_suspended: { label: "Store suspended", dot: "bg-gold", pill: "bg-gold/15 text-ink/80" },
};
const AVATAR = ["bg-brand/10 text-brand", "bg-gold/15 text-ink/80", "bg-ink/10 text-ink/70"];
const TONE: Record<string, string> = {
  success: "bg-brand/10 text-brand", delivered: "bg-brand/10 text-brand", active: "bg-brand/10 text-brand",
  failed: "bg-red-50 text-red-700", flagged: "bg-red-50 text-red-700", cancelled: "bg-red-50 text-red-700", disputed: "bg-red-50 text-red-700",
};
const tone = (s: string) => TONE[s] ?? "bg-gold/15 text-ink/80";

function statusOf(u: AdminUser): Status {
  if (u.restriction === "banned") return "banned";
  if (u.restriction === "suspended" || u.is_banned) return "suspended";
  if (u.store_suspended_at) return "store_suspended";
  return "active";
}

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

const hash = (id: string) => [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0);

function timeAgo(value: string | null) {
  if (!value) return "—";
  const s = (Date.now() - new Date(value).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const fullDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—");

function Avatar({ user, large }: { user: AdminUser; large?: boolean }) {
  const dim = large ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  if (user.logo_url) return <img src={mediaUrl(user.logo_url)} alt="" className={`${dim} shrink-0 rounded-[28%] object-cover`} />;
  return (
    <span aria-hidden="true" className={`grid ${dim} shrink-0 place-items-center rounded-[28%] font-bold ${AVATAR[hash(user.id) % AVATAR.length]}`}>
      {initials(user.full_name)}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-ink/65">{children}</span>
);

function Verify({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-brand/10 text-brand" : "bg-ink/5 text-ink/50"}`}>
      {ok ? <CheckCircle2 size={13} aria-hidden="true" /> : <XCircle size={13} aria-hidden="true" />}{label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line px-5 py-4">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-ink/50">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function Row({ title, sub, status }: { title: string; sub: string; status: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-ink/55">{sub}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone(status)}`}>{status.replace(/_/g, " ")}</span>
    </li>
  );
}

function ConfirmDialog({ pending, busy, onCancel, onConfirm }: { pending: Pending; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  const blocked = !!pending.typed && typed.trim().toUpperCase() !== pending.typed;
  return (
    <div className="modal-backdrop fixed inset-0 z-[75] grid place-items-center bg-black/55 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="modal-panel card w-full max-w-sm p-5">
        <h2 id="confirm-title" className="font-display text-lg font-bold">{pending.title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">{pending.body}</p>
        {pending.typed && (
          <label className="mt-3 block text-xs font-semibold text-ink/60">
            Type {pending.typed} to confirm
            <input className="input mt-1" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className={pending.danger ? "btn bg-red-600 text-white hover:bg-red-700" : "btn-primary"}
            disabled={busy || blocked} onClick={onConfirm}>
            {busy ? "Working…" : pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDrawer({ user, detail, locked, busy, onClose, onModerate, onAnonymize }: {
  user: AdminUser; detail: UserDetail | null; locked: boolean; busy: boolean; onClose: () => void;
  onModerate: (action: Action, target: Target) => void; onAnonymize: () => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<"listings" | "orders" | "payments">("listings");
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, []);

  const d = detail && detail.id === user.id ? detail : null;
  const status = statusOf(user);
  const accountOk = status === "active" || status === "store_suspended";
  const copy = (text: string) => { void navigator.clipboard?.writeText(text); toast("Copied", text); };
  const tabs = [
    ["listings", "Listings", d?.listings.length],
    ["orders", "Orders", d?.orders.length],
    ["payments", "Payments", d?.payments.length],
  ] as const;
  const empty = (text: string) => <p className="py-4 text-sm text-ink/55">{text}</p>;

  return (
    <>
      <div className="modal-backdrop fixed inset-0 z-[64] bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={`${user.full_name} details`}
        className="fixed inset-y-0 right-0 z-[65] flex w-full max-w-md flex-col overflow-y-auto bg-[var(--surface)] shadow-2xl">
        <div className="flex items-start gap-3 px-5 pb-4 pt-5">
          <Avatar user={user} large />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-bold">{user.full_name}</h2>
            <button type="button" onClick={() => copy(user.email)} className="mt-0.5 flex max-w-full items-center gap-1.5 text-sm text-ink/60 hover:text-brand">
              <span className="truncate">{user.email}</span><Copy size={13} aria-label="Copy email" className="shrink-0" />
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusPill status={status} />
              <Chip>{user.user_type === "student" ? "Student" : "Non-student"}</Chip>
              {user.is_courier && <Chip>Courier</Chip>}
              {user.is_admin && <Chip>Admin</Chip>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line hover:text-brand"><X size={17} /></button>
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {user.phone_number && <a className="btn-ghost min-h-9 px-3 text-xs" href={`tel:${user.phone_number}`}><Phone size={14} />Call</a>}
          {user.whatsapp_number && <a className="btn-ghost min-h-9 px-3 text-xs" href={whatsappUrl(user.whatsapp_number)} target="_blank" rel="noreferrer"><MessageCircle size={14} />WhatsApp</a>}
          <a className="btn-ghost min-h-9 px-3 text-xs" href={`mailto:${user.email}`}><Mail size={14} />Email</a>
        </div>

        <Section title="Account">
          <dl className="grid grid-cols-2 gap-3">
            <Info label="Joined" value={fullDate(user.created_at)} />
            <Info label="Location" value={user.hostel_or_business_address} />
            <Info label="Phone" value={user.phone_number} />
            <Info label="WhatsApp" value={user.whatsapp_number} />
          </dl>
          <div className="flex flex-wrap gap-1.5">
            <Verify ok={user.is_email_verified} label="Email" />
            <Verify ok={user.is_verified_student} label="Student" />
            <Verify ok={user.is_verified} label="Profile" />
          </div>
          {d && <p className="text-xs text-ink/55">{d.pending_orders} pending {d.pending_orders === 1 ? "order" : "orders"}{d.badges.length ? `, badges: ${d.badges.join(", ")}` : ""}</p>}
        </Section>

        {user.has_business && (
          <Section title="Business">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[28%] bg-brand/10 text-brand"><Building2 size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.store_name || "Unnamed business"}</p>
                <p className="text-xs text-ink/55">
                  {!user.store_activated_at ? "Setup not completed" : user.store_suspended_at ? "Suspended" : "Live"}
                </p>
              </div>
            </div>
            {user.banner_url && <img src={mediaUrl(user.banner_url)} alt="" className="h-24 w-full rounded-xl object-cover" />}
            <dl className="grid grid-cols-2 gap-3">
              <Info label="Activation" value={user.store_activation_type} />
              <Info label="Activated" value={fullDate(user.store_activated_at)} />
              {user.store_suspended_at && <Info label="Suspended" value={fullDate(user.store_suspended_at)} />}
            </dl>
            {user.store_bio && <p className="whitespace-pre-wrap text-sm text-ink/70">{user.store_bio}</p>}
            {user.store_activated_at && (
              <div className="flex flex-wrap gap-2">
                {user.store_suspended_at
                  ? <button type="button" className="btn-primary" disabled={busy || locked} onClick={() => onModerate("restore", "business")}>Restore business</button>
                  : <>
                    <button type="button" className="btn-ghost" disabled={busy || locked} onClick={() => onModerate("suspend", "business")}>Suspend business</button>
                    <button type="button" className="btn-danger" disabled={busy || locked} onClick={() => onModerate("ban", "business")}>Ban business</button>
                  </>}
              </div>
            )}
          </Section>
        )}

        <Section title="Activity">
          <div role="tablist" className="flex gap-1 rounded-full bg-ink/5 p-1">
            {tabs.map(([key, label, count]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === key ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}>
                {label}{count != null && <span className="ml-1 text-ink/40">{count}</span>}
              </button>
            ))}
          </div>
          {!d ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-brand" size={20} aria-label="Loading" /></div>
            : tab === "listings" ? (d.listings.length ? <ul className="divide-y divide-line">{d.listings.map((i) => <Row key={i.id} title={i.title} sub={`GH₵${Number(i.price).toFixed(2)}, ${i.category}`} status={i.status} />)}</ul> : empty("No listings yet."))
            : tab === "orders" ? (d.orders.length ? <ul className="divide-y divide-line">{d.orders.map((i) => <Row key={i.id} title={i.product_title} sub={`As ${i.role}, ${i.fulfillment_type}`} status={i.status} />)}</ul> : empty("No orders yet."))
            : (d.payments.length ? <ul className="divide-y divide-line">{d.payments.map((i) => <Row key={i.id} title={i.purpose.replace(/_/g, " ")} sub={`${i.currency} ${Number(i.amount).toFixed(2)}, ${timeAgo(i.created_at)}`} status={i.status} />)}</ul> : empty("No payments yet."))}
        </Section>

        <Section title="Moderation">
          <div className="flex flex-wrap gap-2">
            {accountOk ? <>
              <button type="button" className="btn-ghost" disabled={busy || locked} onClick={() => onModerate("suspend", "account")}>Suspend account</button>
              <button type="button" className="btn-danger" disabled={busy || locked} onClick={() => onModerate("ban", "account")}>Ban account</button>
            </> : <>
              <button type="button" className="btn-primary" disabled={busy || locked} onClick={() => onModerate("restore", "account")}>Restore account</button>
              {status === "suspended" && <button type="button" className="btn-danger" disabled={busy || locked} onClick={() => onModerate("ban", "account")}>Ban account</button>}
            </>}
          </div>
          {locked && <p className="text-xs text-ink/55">{user.is_admin ? "Admin accounts can't be moderated here." : "You can't moderate your own account."}</p>}
          <details className="rounded-xl border border-red-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-red-700">Danger zone</summary>
            <p className="mt-2 text-xs leading-5 text-ink/60">Anonymizing removes profile details and disables login for good. Marketplace history stays attached to the anonymized account.</p>
            <button type="button" className="btn-danger mt-3" disabled={busy || locked} onClick={onAnonymize}>Anonymize account</button>
          </details>
          <details className="text-xs text-ink/60">
            <summary className="cursor-pointer font-semibold">Legal</summary>
            <p className="mt-2">Terms accepted {fullDate(user.terms_accepted_at)} (version {user.terms_version || "—"}).</p>
            <p className="mt-1">Business terms accepted {fullDate(user.business_terms_accepted_at)} (version {user.business_terms_version || "—"}).</p>
          </details>
        </Section>
      </aside>
    </>
  );
}

export default function AdminUsers() {
  const { me } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<AdminList["stats"]>({ users: 0, businesses: 0, live_businesses: 0, suspended: 0, banned: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);

  const load = async (term: string, kind: Filter) => {
    const id = ++seq.current;
    setLoading(true);
    setError("");
    try {
      const result = await api<AdminList>(`/admin/users?kind=${kind}${term.trim() ? `&q=${encodeURIComponent(term.trim())}` : ""}`);
      if (id !== seq.current) return;
      setStats(result.stats);
      setUsers(result.users);
    } catch (cause) {
      if (id === seq.current) setError((cause as Error).message);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!me?.is_admin) return;
    const timer = window.setTimeout(() => { void load(query, filter); }, query ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [query, filter, me?.is_admin]);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    let active = true;
    api<UserDetail>(`/admin/users/${openId}`).then((row) => { if (active) setDetail(row); })
      .catch((cause) => { if (active) toast("Couldn't load details", (cause as Error).message); });
    return () => { active = false; };
  }, [openId]);

  const moderate = async (u: AdminUser, action: Action, target: Target) => {
    const updated = await api<AdminUser>(`/admin/users/${u.id}/moderation`, { method: "POST", body: { action, target } });
    setUsers((cur) => cur.map((r) => (r.id === u.id ? { ...r, ...updated } : r)));
    setDetail((cur) => (cur && cur.id === u.id ? { ...cur, ...updated } : cur));
    toast("Updated", `${updated.full_name} was updated.`);
    void load(query, filter);
  };

  const anonymize = async (u: AdminUser) => {
    await api(`/admin/users/${u.id}`, { method: "DELETE" });
    setUsers((cur) => cur.filter((r) => r.id !== u.id));
    setOpenId(null);
    toast("Anonymized", `${u.full_name} was anonymized.`);
    void load(query, filter);
  };

  const askModerate = (u: AdminUser, action: Action, target: Target) => {
    const label = target === "business" ? (u.store_name || u.full_name) : u.full_name;
    const what = target === "business" ? "business" : "account";
    const text = {
      suspend: [`Suspend ${what}?`, target === "business" ? `${label} will be hidden from the marketplace until you restore it.` : `${label} is locked out and their listings are hidden until you restore the account.`, "Suspend"],
      ban: [`Ban ${what}?`, target === "business" ? `${label} will be hidden from the marketplace. Use this for serious or repeat violations.` : `${label} is locked out and their listings are hidden. Use this for serious or repeat violations.`, "Ban"],
      restore: [`Restore ${what}?`, `${label} will be visible and active again.`, "Restore"],
    }[action];
    setPending({ title: text[0], body: text[1], confirmLabel: text[2], danger: action !== "restore", run: () => moderate(u, action, target) });
  };

  const askAnonymize = (u: AdminUser) => setPending({
    title: "Anonymize this account?",
    body: `This removes ${u.full_name}'s profile details and disables login permanently. Marketplace history stays attached to an anonymized account.`,
    confirmLabel: "Anonymize", danger: true, typed: "ANONYMIZE", run: () => anonymize(u),
  });

  const runPending = async () => {
    if (!pending) return;
    setBusy(true);
    try { await pending.run(); } catch (cause) { toast("That didn't work", (cause as Error).message); }
    setBusy(false);
    setPending(null);
  };

  if (!me?.is_admin) return <Navigate to="/" replace />;

  const counts: Partial<Record<Filter, number>> = { all: stats.users, businesses: stats.businesses, suspended: stats.suspended, banned: stats.banned };
  const openUser = users.find((u) => u.id === openId) ?? (detail && detail.id === openId ? detail : null);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-ink/60">{stats.users} accounts and {stats.businesses} businesses, {stats.live_businesses} of them live.</p>
      </header>

      <label className="relative block">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
        <input className="input h-11 pl-10 pr-10" aria-label="Search users" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, store, email, phone or location" />
        {loading ? <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-ink/40" aria-label="Searching" />
          : query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink/50 hover:text-brand"><X size={15} /></button>}
      </label>

      <div role="tablist" aria-label="Filter users" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => { setFilter(key); setOpenId(null); }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${filter === key ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70 hover:border-brand/40"}`}>
            {label}
            {counts[key] != null && <span className={`text-xs ${filter === key ? "text-white/80" : "text-ink/45"}`}>{counts[key]}</span>}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden !p-0">
        {users.length > 0 && (
          <div className="hidden items-center gap-3 border-b border-line px-4 py-2 text-xs font-semibold text-ink/50 sm:flex">
            <span className="w-10 shrink-0" /><span className="flex-1">Person</span>
            <span className="w-24 shrink-0">Account</span><span className="w-20 shrink-0">Joined</span>
            <span className="w-32 shrink-0">Status</span><span className="w-4 shrink-0" />
          </div>
        )}
        <ul className="divide-y divide-line">
          {loading && users.length === 0 && [0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="h-10 w-10 animate-pulse rounded-[28%] bg-line/60" />
              <span className="flex-1 space-y-2"><span className="block h-3 w-40 animate-pulse rounded bg-line/60" /><span className="block h-3 w-56 animate-pulse rounded bg-line/60" /></span>
            </li>
          ))}
          {users.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => setOpenId(u.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-paper ${openId === u.id ? "bg-brand/5" : ""}`}>
                <Avatar user={u} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{u.full_name}</span>
                  <span className="block truncate text-xs text-ink/55">{u.email}</span>
                  {u.store_name && <span className="mt-0.5 flex items-center gap-1 text-xs text-ink/60"><Building2 size={12} aria-hidden="true" /><span className="truncate">{u.store_name}</span></span>}
                </span>
                <span className="hidden w-24 shrink-0 text-xs text-ink/65 sm:block">{u.is_admin ? "Admin" : u.user_type === "student" ? "Student" : "Non-student"}</span>
                <span className="hidden w-20 shrink-0 text-xs text-ink/55 sm:block">{timeAgo(u.created_at)}</span>
                <span className="sm:w-32 sm:shrink-0"><StatusPill status={statusOf(u)} /></span>
                <ChevronRight size={16} aria-hidden="true" className="hidden w-4 shrink-0 text-ink/30 sm:block" />
              </button>
            </li>
          ))}
        </ul>
        {!loading && users.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold">No one matches that</p>
            <p className="mt-1 text-sm text-ink/60">{query ? "Try a different name, email or phone number." : "Nobody is in this group yet."}</p>
            {(query || filter !== "all") && <button type="button" className="btn-ghost mt-4" onClick={() => { setQuery(""); setFilter("all"); }}>Clear search and filters</button>}
          </div>
        )}
      </div>
      {users.length >= LIMIT && <p className="text-center text-xs text-ink/55">Showing the latest {LIMIT}. Search to narrow it down.</p>}

      {openUser && (
        <UserDrawer key={openUser.id} user={openUser} detail={detail} busy={busy}
          locked={openUser.is_admin || openUser.id === me.id}
          onClose={() => setOpenId(null)}
          onModerate={(action, target) => askModerate(openUser, action, target)}
          onAnonymize={() => askAnonymize(openUser)} />
      )}
      {pending && <ConfirmDialog pending={pending} busy={busy} onCancel={() => setPending(null)} onConfirm={() => void runPending()} />}
    </div>
  );
}
