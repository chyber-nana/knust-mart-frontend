import { Package, Wrench } from "lucide-react";

export type ListingKind = "product" | "service";
export const SERVICE_CATEGORY = "Services";
export const kindOf = (category?: string | null): ListingKind => (category === SERVICE_CATEGORY ? "service" : "product");
export const KIND_LABEL: Record<ListingKind, string> = { product: "Product", service: "Service" };

export function KindIcon({ kind, size = 14, className = "" }: { kind: ListingKind; size?: number; className?: string }) {
  const Icon = kind === "service" ? Wrench : Package;
  return <Icon size={size} aria-hidden="true" className={className} />;
}
