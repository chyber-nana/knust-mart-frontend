import { BADGE_BY_KEY, BadgePill } from "./badgeCatalog";

export default function UserBadges({ badges }: { badges: string[] }) {
  if (!badges.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Seller badges">
      {badges.map((badge) => {
        const known = BADGE_BY_KEY[badge];
        return <BadgePill key={badge} icon={known ? badge : "custom"} label={known?.label ?? (badge.startsWith("custom:") ? badge.slice(7) : badge)} />;
      })}
    </div>
  );
}
