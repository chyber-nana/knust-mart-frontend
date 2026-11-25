import { BADGE_BY_KEY, BadgePill } from "./badgeCatalog";

export default function UserBadges({ badges, display = "row" }: { badges: string[]; display?: "row" | "awards" }) {
  if (!badges.length) return null;
  return (
    <div className={display === "awards" ? "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" : "mt-2 flex flex-wrap gap-1.5"} aria-label="Seller badges and awards">
      {badges.map((badge) => {
        const known = BADGE_BY_KEY[badge];
        return <BadgePill key={badge} icon={known ? badge : "custom"} label={known?.label ?? (badge.startsWith("custom:") ? badge.slice(7) : badge)} size={display === "awards" ? "lg" : "sm"} />;
      })}
    </div>
  );
}
