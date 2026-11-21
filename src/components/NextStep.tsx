import { MapPin, Phone } from "lucide-react";

export const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, KNUST, Kumasi, Ghana`)}`;

interface Info { role: "buyer" | "seller" | "courier"; status: string; fulfillment_type: string; released?: boolean; pickup: string; dropoff: string; dropoff_note?: string | null }

/** One plain instruction for what the viewer should do right now. */
export function nextStep(i: Info): { title: string; text: string } | null {
  const { role, status: s } = i;
  if (i.fulfillment_type === "pickup") {
    if (s === "awaiting_seller") return role === "seller" ? { title: "Confirm you have the item", text: "Tell the buyer if it's available." } : { title: "Waiting for the seller", text: "The seller is confirming the item is available." };
    if (s === "ready_for_pickup") return role === "seller" ? { title: "Buyer is coming to collect", text: `Meet them at ${i.pickup}. Take payment by MoMo or cash.` } : { title: "Go and collect it", text: `Meet the seller at ${i.pickup}, pay by MoMo or cash, then tap "I picked it up".` };
    return null;
  }
  if (s === "awaiting_seller") return role === "seller" ? { title: "Confirm you have the item", text: "Open the order and tell the buyer it's available." } : { title: "Waiting for the seller", text: "The seller is confirming the item is available." };
  if (s === "pending") return role === "seller" ? { title: "Waiting for a courier", text: "Keep the item ready. You'll be told when a courier is on the way." } : role === "buyer" ? { title: "Finding you a courier", text: "You'll be told as soon as one accepts." } : null;
  if (s === "accepted" && !i.released) {
    if (role === "courier") return { title: "Step 1: go to the seller", text: `Head to ${i.pickup}. Call the seller if you can't find them. They must confirm the handover before you can start.` };
    if (role === "seller") return { title: "Courier is coming to collect", text: "Hand the item to the courier, then tap \"I handed it to the courier\"." };
    return { title: "Courier is collecting your item", text: "They're going to the seller now. Keep your phone on." };
  }
  if (s === "accepted") {
    if (role === "courier") return { title: "Step 2: start the delivery", text: "The seller confirmed the handover. Tap \"I have it, start delivery\"." };
    return { title: "Handed to the courier", text: role === "buyer" ? "The courier is setting off to you." : "The courier has the item." };
  }
  if (s === "in_transit") {
    if (role === "courier") return { title: "Step 3: deliver it", text: `Go to ${i.dropoff}${i.dropoff_note ? ` (${i.dropoff_note})` : ""}. Call the buyer to meet. Scan their QR or enter their PIN, then collect payment.` };
    if (role === "buyer") return { title: "On its way to you", text: `Be at ${i.dropoff}. Show your QR or PIN only once the item is in your hands, then pay the seller and courier.` };
    return { title: "Out for delivery", text: "The courier is bringing it to the buyer." };
  }
  return null;
}

export function NextStepCard({ info }: { info: Info }) {
  const step = nextStep(info);
  if (!step) return null;
  return (
    <div role="status" className="mb-4 rounded-2xl border border-brand/30 bg-brand/5 p-4">
      <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-brand"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-brand" /></span>Live · what to do now</p>
      <p className="font-display text-lg font-bold">{step.title}</p>
      <p className="mt-1 text-sm leading-5 text-ink/70">{step.text}</p>
    </div>
  );
}

export function PlaceLink({ place, label }: { place: string; label: string }) {
  return <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand"><MapPin size={13} />{label}</a>;
}

export function CallLink({ phone, label }: { phone?: string | null; label: string }) {
  if (!phone) return null;
  return <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand"><Phone size={13} />{label}</a>;
}
