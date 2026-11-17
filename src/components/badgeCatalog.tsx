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

export function BadgePill({ icon: iconName, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 bg-[var(--surface)] py-1 pl-2 pr-2.5 text-[11px] font-semibold leading-none text-ink">
      <BadgeIcon name={iconName} />
      {label}
    </span>
  );
}
