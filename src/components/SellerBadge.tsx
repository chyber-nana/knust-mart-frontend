import { BadgePill } from "./badgeCatalog";

export default function SellerBadge({ type }: { type: string }) {
  const student = type === "student";
  return <BadgePill icon={student ? "student_seller" : "external_vendor"} label={student ? "Student seller" : "External vendor"} />;
}
