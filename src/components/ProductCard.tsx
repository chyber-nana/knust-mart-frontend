import { Link } from "react-router-dom";
import { Heart, MapPin, Scissors } from "lucide-react";
import { Card, mediaUrl } from "../api";
import SellerBadge from "./SellerBadge";

export default function ProductCard({ p, onClick }: { p: Card; onClick?: () => void }) {
  const content = <>
      <div className="relative aspect-[4/4.3] overflow-hidden bg-[#ebe9e2]">
        {p.image && <img src={mediaUrl(p.image)} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />}
        {p.is_promoted && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-gold">Featured</span>}
        <button type="button" aria-label="Save item" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/80 bg-white/90 text-ink/65 transition hover:bg-white hover:text-brand"><Heart size={15} /></button>
      </div>
      <div className="space-y-2 p-3 sm:p-3.5">
        <p className="font-display text-lg font-bold tracking-tight sm:text-xl">GH₵{p.price.toFixed(2)}</p>
        <p className="line-clamp-2 min-h-10 text-[13px] leading-5 text-ink/80">{p.title}</p>
        <p className="flex items-center gap-1 truncate text-[11px] text-ink/50">
          {p.category === "Services" ? <Scissors size={12} className="shrink-0" /> : <MapPin size={12} className="shrink-0" />}
          {p.category === "Services" ? "Service" : [p.hall_location, p.condition].filter(Boolean).join(" · ")}
        </p>
        <div className="pt-1"><SellerBadge type={p.seller.user_type} /></div>
      </div>
    </>;
  const className = "product-card group block w-full overflow-hidden rounded-[1.25rem] border border-line bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md";
  return onClick
    ? <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }} className={`${className} cursor-pointer`}>{content}</div>
    : <Link to={`/products/${p.id}`} className={className}>{content}</Link>;
}
