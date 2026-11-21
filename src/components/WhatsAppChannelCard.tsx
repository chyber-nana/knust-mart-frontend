import { MessageCircle } from "lucide-react";

export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb9fsVhHrDZb0BF1cd2o";

export default function WhatsAppChannelCard() {
  return (
    <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-brand/25 bg-[#e6ebdf] p-3.5 text-left transition hover:border-brand">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[30%] bg-brand text-white"><MessageCircle size={19} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Join the KNUST Mart WhatsApp channel</span>
        <span className="block text-xs text-ink/65">Get campus deals, updates and announcements.</span>
      </span>
      <span className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">Join</span>
    </a>
  );
}
