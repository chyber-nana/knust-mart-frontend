import { ReactNode } from "react";

export interface BadgeInfo {
  key: string;
  label: string;
  description: string;
  criteria: string;
  icon: ReactNode;
}

const PATHS: Record<string, ReactNode> = {
  pioneer: <><path d="M6 21V4" /><path d="M6 5h12l-3 3.5L18 12H6" /></>,
  verified_student: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5" /><path d="M22 9v5" /></>,
  trusted_vendor: <><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  sales_20: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  power_seller: <><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></>,
  fast_responder: <><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></>,
  top_rated: <><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></>,
  campus_legend: <><path d="M12 3l7 2.5V12c0 4-3 7-7 9-4-2-7-5-7-9V5.5z" /><path d="M12 8l3 3-3 3-3-3z" /></>,
  custom: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L7.5 21 12 18.5l4.5 2.5L15 13.5" /></>,
  student_seller: <><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M8 7h7" /></>,
  external_vendor: <><path d="M4 9l1.5-5h13L20 9" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
};

export function BadgeIcon({ name, size = 14 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {PATHS[name] ?? PATHS.custom}
    </svg>
  );
}

const icon = (key: string) => <BadgeIcon name={key} size={22} />;

export const BADGES: BadgeInfo[] = [
  { key: "pioneer", label: "Pioneer", description: "One of the first people to join KNUST Mart.", criteria: "Awarded automatically to the first 10 accounts registered on the platform.", icon: icon("pioneer") },
  { key: "verified_student", label: "Verified Student", description: "Identity confirmed as a KNUST student.", criteria: "Complete KNUST student identity verification with your student email.", icon: icon("verified_student") },
  { key: "trusted_vendor", label: "Trusted Vendor", description: "A seller with a clean record and happy buyers.", criteria: "At least 5 delivered orders, 5 reviews averaging 4.5 or higher, and no orders currently in dispute.", icon: icon("trusted_vendor") },
  { key: "sales_20", label: "20+ Sales", description: "A seller with a solid sales history.", criteria: "Unlocked automatically after 20 successfully completed orders.", icon: icon("sales_20") },
  { key: "power_seller", label: "Power Seller", description: "A high-volume seller on campus.", criteria: "Unlocked automatically after more than 50 completed orders.", icon: icon("power_seller") },
  { key: "fast_responder", label: "Fast Responder", description: "Replies to buyers quickly.", criteria: "Average response time under 15 minutes across at least 5 order requests.", icon: icon("fast_responder") },
  { key: "top_rated", label: "Top Rated", description: "Consistently excellent reviews.", criteria: "A 4.8 or higher average rating across at least 10 reviews.", icon: icon("top_rated") },
  { key: "campus_legend", label: "Campus Legend", description: "Recognition for standout student entrepreneurs and community leaders.", criteria: "Assigned by KNUST Mart admins. It cannot be applied for or earned automatically.", icon: icon("campus_legend") },
];

export const BADGE_BY_KEY: Record<string, BadgeInfo> = Object.fromEntries(BADGES.map((badge) => [badge.key, badge]));

const BADGE_STYLES: Record<string, string> = {
  pioneer: "border-amber-300/80 bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 shadow-amber-900/10",
  verified_student: "border-sky-300/80 bg-gradient-to-br from-sky-50 to-cyan-100 text-sky-900 shadow-sky-900/10",
  trusted_vendor: "border-emerald-300/80 bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 shadow-emerald-900/10",
  sales_20: "border-violet-300/80 bg-gradient-to-br from-violet-50 to-fuchsia-100 text-violet-900 shadow-violet-900/10",
  power_seller: "border-orange-300/80 bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 shadow-orange-900/10",
  fast_responder: "border-cyan-300/80 bg-gradient-to-br from-cyan-50 to-teal-100 text-teal-900 shadow-teal-900/10",
  top_rated: "border-rose-300/80 bg-gradient-to-br from-rose-50 to-pink-100 text-rose-900 shadow-rose-900/10",
  campus_legend: "border-yellow-400/80 bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 text-amber-950 shadow-amber-900/15",
};

export function BadgePill({ icon: iconName, label, size = "sm" }: { icon: string; label: string; size?: "sm" | "lg" }) {
  const known = BADGE_BY_KEY[iconName];
  const style = BADGE_STYLES[iconName] ?? "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800";
  return (
    <span title={known?.description ?? label} className={`inline-flex max-w-full items-center gap-1.5 border font-semibold shadow-sm ${style} ${size === "lg" ? "rounded-xl px-3 py-2 text-xs" : "rounded-full px-2.5 py-1.5 text-[10px]"}`}>
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/65"><BadgeIcon name={iconName} size={size === "lg" ? 14 : 12} /></span>
      <span className="truncate">{label}</span>
    </span>
  );
}
