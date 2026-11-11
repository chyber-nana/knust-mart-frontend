import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api";
import Avatar from "./Avatar";

export interface Business {
  id: string;
  name: string;
  user_type: string;
  bio: string | null;
  address: string | null;
  logo_url: string | null;
  logo_position_x?: number;
  logo_position_y?: number;
  banner_url: string | null;
  banner_position_x?: number;
  banner_position_y: number;
  rating: number | null;
  review_count: number;
  active_listings: number;
}

export default function BusinessCard({ business, featured = false }: { business: Business; featured?: boolean }) {
  return (
    <Link
      to={`/vendors/${business.id}`}
      className={`group block shrink-0 overflow-hidden rounded-[1.4rem] border border-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md ${featured ? "w-[min(82vw,24rem)] snap-start sm:w-[22rem]" : "w-full"}`}
    >
      <div className={`relative overflow-visible bg-brand/10 ${featured ? "h-32" : "h-24"}`}>
        {business.banner_url
          ? <img src={mediaUrl(business.banner_url)} alt="" style={{ objectPosition: `${business.banner_position_x ?? 50}% ${business.banner_position_y ?? 50}%` }} className="h-full w-full rounded-t-[inherit] object-cover transition duration-500 group-hover:scale-[1.04]" />
          : <div className="relative h-full overflow-hidden rounded-t-[inherit] bg-[#e7ecdf]"><span className="absolute -right-4 -top-10 h-32 w-32 rounded-full border-[18px] border-white/60" /><span className="absolute bottom-[-52px] right-20 h-28 w-28 rounded-full bg-[#d6dfcd]" /></div>}
        <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-brand">
          {business.user_type === "student" ? "Student-run" : "Campus vendor"}
        </span>
        <div className="absolute bottom-0 left-4 z-10 translate-y-1/2 rounded-[30%] border-[3px] border-white shadow-sm"><Avatar src={business.logo_url} name={business.name} size="md" positionX={business.logo_position_x} positionY={business.logo_position_y} /></div>
      </div>
      <div className="relative px-4 pb-4 pt-9">
        <ArrowUpRight size={17} className="absolute right-4 top-4 text-ink/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
        <h3 className="truncate pr-6 font-display text-lg font-bold">{business.name}</h3>
        {business.bio && <p className="mt-1 line-clamp-1 min-h-5 text-xs text-ink/60">{business.bio}</p>}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink/60">
          <span className="flex min-w-0 items-center gap-1"><MapPin size={13} className="shrink-0" /><span className="truncate">{business.address || "KNUST campus"}</span></span>
          <span className="flex shrink-0 items-center gap-1 text-gold"><Star size={13} fill="currentColor" />{business.rating ? business.rating.toFixed(1) : "New"} <span className="text-ink/45">· {business.active_listings} items</span></span>
        </div>
      </div>
    </Link>
  );
}
