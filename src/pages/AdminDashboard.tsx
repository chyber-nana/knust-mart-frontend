import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, Building2, Package, ShieldAlert, Truck, Users, Wrench } from "lucide-react";
import { api } from "../api";

interface Stats {
  users: { total: number; verified_students: number; live_businesses: number; suspended_or_banned: number };
  couriers: { active: number; registered: number; free_launch: number; paid: number };
  products: { total: number; by_status: Record<string, number>; services: number; physical: number; promoted: number };
  deliveries: Record<string, number>;
  revenue: { total: number; by_purpose: Record<string, number> };
}

const PURPOSE: Record<string, string> = { store_activation: "Business registration", listing_promotion: "Promotions", courier_registration: "Courier registration" };
const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<Stats>("/admin/stats").then(setS).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="space-y-5 pb-8">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Overview</h1>
      </header>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      {!s && !err && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((k) => <div key={k} className="h-28 animate-pulse rounded-2xl bg-line/50" />)}</div>}
      {s && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={<Truck size={18} />} label="Couriers" value={s.couriers.active} note={`${s.couriers.registered} registered`} primary />
          <Kpi icon={<Package size={18} />} label="Products" value={s.products.total} note={`${s.products.by_status.active ?? 0} active`} primary />
          <Kpi icon={<Users size={18} />} label="Users" value={s.users.total} note={`${s.users.verified_students} verified students`} />
          <Kpi icon={<Building2 size={18} />} label="Live businesses" value={s.users.live_businesses} note={`${s.users.suspended_or_banned} restricted accounts`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Listings" icon={<Package size={16} />}>
            <Bars rows={[
              ...Object.entries(s.products.by_status).map(([k, v]) => [label(k), v] as [string, number]),
            ]} total={s.products.total} />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              <Mini label="Products" value={s.products.physical} icon={<Package size={13} />} />
              <Mini label="Services" value={s.products.services} icon={<Wrench size={13} />} />
              <Mini label="Promoted" value={s.products.promoted} />
            </div>
          </Panel>
          <Panel title="Couriers" icon={<Truck size={16} />}>
            <Bars rows={[["Free launch spots", s.couriers.free_launch], ["Paid registrations", s.couriers.paid], ["Online now", s.couriers.active]]} total={Math.max(s.couriers.registered, s.couriers.active, 1)} />
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink/60">{s.couriers.free_launch} of 5 free spots used.</p>
          </Panel>
          <Panel title="Deliveries" icon={<Truck size={16} />}>
            {Object.keys(s.deliveries).length === 0 ? <p className="text-sm text-ink/60">No deliveries yet.</p>
              : <Bars rows={Object.entries(s.deliveries).map(([k, v]) => [label(k), v] as [string, number])} total={Object.values(s.deliveries).reduce<number>((a, b) => a + Number(b), 0)} />}
          </Panel>
          <Panel title="Revenue" icon={<Banknote size={16} />}>
            <p className="font-display text-3xl font-bold tracking-tight">GH₵{s.revenue.total.toFixed(2)}</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {Object.entries(PURPOSE).map(([k, name]) => <li key={k} className="flex justify-between py-2"><span className="text-ink/65">{name}</span><span className="font-semibold">GH₵{(s.revenue.by_purpose[k] ?? 0).toFixed(2)}</span></li>)}
            </ul>
          </Panel>
        </div>

        <section aria-label="Admin features">
          <h2 className="mb-3 font-display text-lg font-bold">Manage</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["/admin/users", "Users & businesses", "Search, suspend, ban, restore"], ["/admin/appeals", "Appeals", "Review suspension appeals"], ["/admin/ads", "Campus flyers", "Manage homepage flyers"], ["/admin/badges", "Badges", "Award and edit badges"]].map(([to, t, d]) =>
              <Link key={to} to={to} className="card rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-ink/60">{d}</p></Link>)}
          </div>
        </section>
      </>}
    </div>
  );
}

function Kpi({ icon, label, value, note, primary }: { icon: ReactNode; label: string; value: number; note: string; primary?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${primary ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
    <div className="flex items-center justify-between"><span className={`text-xs font-semibold ${primary ? "text-white/80" : "text-ink/60"}`}>{label}</span><span className={`grid h-8 w-8 place-items-center rounded-[30%] ${primary ? "bg-white/15" : "bg-[#e6ebdf] text-brand"}`}>{icon}</span></div>
    <p className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{value.toLocaleString()}</p>
    <p className={`mt-1 text-xs ${primary ? "text-white/75" : "text-ink/55"}`}>{note}</p>
  </div>;
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="card rounded-2xl p-4 sm:p-5">
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><span className="text-brand">{icon}</span>{title}</h2>{children}
  </section>;
}

function Bars({ rows, total }: { rows: [string, number][]; total: number }) {
  return <ul className="space-y-3">{rows.map(([name, n]) => <li key={name}>
    <div className="mb-1 flex justify-between text-xs"><span className="text-ink/70">{name}</span><span className="font-semibold">{n}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-[#e6ebdf]"><div className="h-full rounded-full bg-brand" style={{ width: `${total ? Math.min(100, (n / total) * 100) : 0}%` }} /></div>
  </li>)}</ul>;
}

function Mini({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return <div><p className="font-display text-xl font-bold">{value}</p><p className="flex items-center justify-center gap-1 text-[11px] text-ink/55">{icon}{label}</p></div>;
}
