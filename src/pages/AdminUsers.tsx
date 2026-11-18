import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Building2, Megaphone, Search, Shield, Users } from "lucide-react";
import { api, mediaUrl } from "../api";
import { useAuth } from "../auth";

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

type Tab = "users" | "businesses";
type Action = "suspend" | "ban" | "restore";
type Target = "account" | "business";

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function when(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function statusLabel(user: AdminUser) {
  if (user.restriction === "banned") return "Banned";
  if (user.restriction === "suspended" || user.is_banned) return "Suspended";
  if (user.store_suspended_at) return "Business suspended";
  return "Active";
}

export default function AdminUsers() {
  const { me } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<AdminList["stats"]>({ users: 0, businesses: 0, live_businesses: 0, suspended: 0, banned: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (term = query, kind: Tab = tab) => {
    setLoading(true);
    setError("");
    try {
      const result = await api<AdminList>(
        `/admin/users?kind=${kind}${term.trim() ? `&q=${encodeURIComponent(term.trim())}` : ""}`,
      );
      setStats(result.stats);
      setUsers(result.users);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me?.is_admin) void load("", "users");
  }, [me?.is_admin]);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    let active = true;
    api<UserDetail>(`/admin/users/${openId}`).then((row) => {
      if (active) setDetail(row);
    }).catch((cause) => {
      if (active) setError((cause as Error).message);
    });
    return () => { active = false; };
  }, [openId]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    void load();
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setOpenId(null);
    void load(query, next);
  };

  const moderate = async (user: AdminUser, action: Action, target: Target) => {
    const noun = target === "business" ? `business ${user.store_name || user.name}` : `account ${user.full_name}`;
    const confirmed = window.confirm(
      action === "restore" ? `Restore ${noun}?` : `${action === "ban" ? "Ban" : "Suspend"} ${noun}?`,
    );
    if (!confirmed) return;
    setBusy(`${user.id}:${action}:${target}`);
    setError("");
    setMessage("");
    try {
      const updated = await api<AdminUser>(`/admin/users/${user.id}/moderation`, {
        method: "POST",
        body: { action, target },
      });
      setUsers((current) => current.map((row) => row.id === user.id ? { ...row, ...updated } : row));
      if (detail?.id === user.id) setDetail((current) => current ? { ...current, ...updated } : current);
      setMessage(`${updated.full_name} was updated.`);
      void load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  };

  const anonymize = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Anonymize ${user.full_name} (${user.email})? Profile details are removed and login is disabled. Marketplace history stays attached to an anonymized account.`,
    );
    if (!confirmed) return;
    setBusy(user.id);
    setError("");
    setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      if (openId === user.id) setOpenId(null);
      setMessage(`${user.full_name} was anonymized.`);
      void load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  };

  const visible = useMemo(
    () => tab === "businesses" ? users.filter((user) => user.store_activated_at) : users,
    [tab, users],
  );

  if (!me?.is_admin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Campus dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">
          Review every account and business, search by name or contact, then suspend, ban, restore, or anonymize.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        <Link to="/admin" className="btn-primary text-xs">Dashboard</Link>
        <Link to="/admin/appeals" className="btn-ghost text-xs">Appeals</Link>
        <Link to="/admin/ads" className="btn-ghost text-xs"><Megaphone size={14} />Flyers</Link>
        <Link to="/admin/badges" className="btn-ghost text-xs">Badges</Link>
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={stats.users} icon={<Users size={18} />} />
        <Stat label="Businesses" value={stats.businesses} hint={`${stats.live_businesses} live`} icon={<Building2 size={18} />} />
        <Stat label="Suspended" value={stats.suspended} />
        <Stat label="Banned" value={stats.banned} />
      </div>

      <div className="flex gap-2">
        <button type="button" className={tab === "users" ? "btn-primary" : "btn-ghost"} onClick={() => switchTab("users")}>Users</button>
        <button type="button" className={tab === "businesses" ? "btn-primary" : "btn-ghost"} onClick={() => switchTab("businesses")}>Businesses</button>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            className="input pl-9"
            aria-label="Search accounts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, store, email, phone, or location"
          />
        </label>
        <button className="btn-primary shrink-0" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-brand">{message}</p>}

      <div className="space-y-3">
        {visible.map((user) => {
          const open = openId === user.id;
          const accountLocked = user.is_admin || user.id === me.id;
          return (
            <section key={user.id} className="card overflow-hidden">
              <button type="button" className="flex w-full flex-wrap items-center gap-3 p-4 text-left" onClick={() => setOpenId(open ? null : user.id)}>
                {user.logo_url
                  ? <img src={mediaUrl(user.logo_url)} alt="" className="h-12 w-12 rounded-[28%] object-cover" />
                  : <span className="grid h-12 w-12 place-items-center rounded-[28%] bg-brand/10 text-brand"><Shield size={18} /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{tab === "businesses" ? (user.store_name || user.full_name) : user.full_name}</span>
                  <span className="block truncate text-xs text-ink/55">{user.email}{user.store_name ? ` · ${user.store_name}` : ""}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${user.restriction === "banned" ? "bg-red-50 text-red-700" : user.is_banned || user.store_suspended_at ? "bg-gold/15 text-ink/80" : "bg-brand/10 text-brand"}`}>
                  {statusLabel(user)}
                </span>
              </button>
              {open && (
                <div className="space-y-4 border-t border-line p-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Field label="Full name" value={user.full_name} />
                    <Field label="Email" value={user.email} />
                    <Field label="User type" value={user.user_type} />
                    <Field label="Created" value={when(user.created_at)} />
                    <Field label="Student verified" value={yesNo(user.is_verified_student)} />
                    <Field label="Email verified" value={yesNo(user.is_email_verified)} />
                    <Field label="Profile verified" value={yesNo(user.is_verified)} />
                    <Field label="Courier" value={yesNo(user.is_courier)} />
                    <Field label="Admin" value={yesNo(user.is_admin)} />
                    <Field label="Phone" value={user.phone_number} />
                    <Field label="WhatsApp" value={user.whatsapp_number} />
                    <Field label="Location" value={user.hostel_or_business_address} />
                    <Field label="Store name" value={user.store_name} />
                    <Field label="Store type" value={user.store_activation_type} />
                    <Field label="Store activated" value={when(user.store_activated_at)} />
                    <Field label="Store suspended" value={when(user.store_suspended_at)} />
                    <Field label="Terms accepted" value={`${when(user.terms_accepted_at)} (${user.terms_version || "—"})`} />
                    <Field label="Business terms" value={`${when(user.business_terms_accepted_at)} (${user.business_terms_version || "—"})`} />
                    <div className="sm:col-span-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/45">Store bio</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm">{user.store_bio || "—"}</dd>
                    </div>
                  </dl>
                  {user.banner_url && <img src={mediaUrl(user.banner_url)} alt="" className="h-28 w-full rounded-xl object-cover" />}
                  {detail?.id === user.id && (
                    <>
                      <p className="text-xs text-ink/55">Pending orders: {detail.pending_orders} · Badges: {detail.badges.length ? detail.badges.join(", ") : "none"}</p>
                      <DetailList title="Listings" empty="No listings." items={detail.listings.map((item) => `${item.title} · ${item.status} · GHS ${item.price}`)} />
                      <DetailList title="Orders" empty="No orders." items={detail.orders.map((item) => `${item.product_title} · ${item.role} · ${item.status}`)} />
                      <DetailList title="Payments" empty="No payments." items={detail.payments.map((item) => `${item.purpose} · ${item.status} · ${item.currency} ${item.amount}`)} />
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "suspend", "account")}>Suspend account</button>
                    <button type="button" className="btn-danger" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "ban", "account")}>Ban account</button>
                    <button type="button" className="btn-ghost" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "restore", "account")}>Restore account</button>
                    {user.store_activated_at && <>
                      <button type="button" className="btn-ghost" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "suspend", "business")}>Suspend business</button>
                      <button type="button" className="btn-danger" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "ban", "business")}>Ban business</button>
                      <button type="button" className="btn-ghost" disabled={!!busy || accountLocked} onClick={() => void moderate(user, "restore", "business")}>Restore business</button>
                    </>}
                    <button type="button" className="btn-danger" disabled={!!busy || accountLocked} onClick={() => void anonymize(user)}>Anonymize</button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
        {!loading && visible.length === 0 && <p className="card p-5 text-sm text-ink/60">No matching {tab}.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, icon }: { label: string; value: number; hint?: string; icon?: ReactNode }) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">{label}</p>
        {icon && <span className="text-brand">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-1 break-words">{value || "—"}</dd>
    </div>
  );
}

function DetailList({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? <p className="mt-1 text-xs text-ink/55">{empty}</p> : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink/70">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
