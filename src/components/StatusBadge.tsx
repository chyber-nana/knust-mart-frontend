const STYLES: Record<string, string> = {
  awaiting_seller: "bg-amber-50 text-amber-800 border-amber-200",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  ready_for_pickup: "bg-green-50 text-green-800 border-green-200",
  accepted: "bg-blue-50 text-blue-800 border-blue-200",
  in_transit: "bg-blue-50 text-blue-800 border-blue-200",
  delivered: "bg-green-50 text-green-800 border-green-200",
  failed: "bg-red-50 text-red-800 border-red-200",
  disputed: "bg-red-50 text-red-800 border-red-200",
};
const LABELS: Record<string, string> = { awaiting_seller: "Waiting for seller", pending: "Waiting for courier", ready_for_pickup: "Ready for pickup", accepted: "Courier assigned", in_transit: "On the way", delivered: "Delivered", failed: "Unavailable / failed", disputed: "Disputed" };

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? ""}`}>{LABELS[status] ?? status}</span>;
}
