export default function SellerBadge({ type }: { type: string }) {
  const student = type === "student";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${student ? "border-brand/40 text-brand" : "border-gold/50 text-gold"}`}>
      {student ? "Student seller" : "External vendor"}
    </span>
  );
}
