const LABELS: Record<string, string> = {
  pioneer: "Pioneer",
  top_rated: "Top Rated",
  fast_responder: "Fast Responder",
  verified_student: "Verified Student",
  campus_legend: "Campus Legend",
  trusted_vendor: "Trusted Vendor",
};

export default function UserBadges({ badges }: { badges: string[] }) {
  if (!badges.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Seller badges">
      {badges.map((badge) => (
        <span key={badge} className="rounded-full border border-gold/50 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-ink">
          {LABELS[badge] ?? (badge.startsWith("custom:") ? badge.slice(7) : badge)}
        </span>
      ))}
    </div>
  );
}
