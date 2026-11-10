import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Plus, Star } from "lucide-react";
import { api, Card, mediaUrl } from "../api";
import { useAuth } from "../auth";
import ProductCard from "../components/ProductCard";
import SellerBadge from "../components/SellerBadge";
import VendorCard from "../components/VendorCard";
import Avatar from "../components/Avatar";

interface V { id: string; name: string; user_type: string; bio: string | null; address: string | null; logo_url: string | null; banner_url: string | null; banner_position_y: number; sales: number; rating: number | null; review_count: number; reviews: { id: number; reviewer_name: string; rating: number; comment: string | null }[]; products: Card[] }

export default function Vendor() {
  const { id } = useParams();
  const { me } = useAuth();
  const [v, setV] = useState<V | null>(null);
  const [err, setErr] = useState("");
  const [shareErr, setShareErr] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setV(null); api<V>(`/vendors/${id}`).then(setV).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <p className="text-sm text-red-700">{err}</p>;
  if (!v) return <p className="text-sm">Loading…</p>;
  const share = async () => {
    const url = `${window.location.origin}/vendors/${v.id}`;
    setShareErr("");
    try {
      if (navigator.share) await navigator.share({ title: v.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (x) {
      if ((x as DOMException).name !== "AbortError") setShareErr("Could not share the storefront link.");
    }
  };
  return (
    <>
      <div className="relative mb-12 aspect-[2.4/1] overflow-visible rounded-[1.4rem] border border-line bg-brand/90 sm:mb-14 sm:aspect-[3.4/1]">
        {v.banner_url && <img src={mediaUrl(v.banner_url)} alt="" style={{ objectPosition: `center ${v.banner_position_y ?? 50}%` }} className="h-full w-full rounded-[inherit] object-cover" />}
        <div className="absolute -bottom-8 left-4 z-10 rounded-[30%] border-4 border-paper shadow-sm sm:-bottom-10 sm:left-6"><Avatar src={v.logo_url} name={v.name} size="lg" /></div>
      </div>
      <div className="flex flex-wrap items-end gap-3 px-3 sm:px-6">
        <div className="min-w-0 flex-1 pb-1"><h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{v.name}</h1><SellerBadge type={v.user_type} /></div>
        <div className="flex w-full gap-2 pb-1 sm:w-auto">
          <button className="btn-ghost flex-1 sm:flex-none" onClick={share}>{copied ? "Link copied" : "Share link"}</button>
          {me?.id === v.id && <>
            <Link to="/sell" className="btn-primary flex-1 sm:flex-none"><Plus size={16} />Add product</Link>
            <Link to="/store/edit" className="btn-ghost flex-1 sm:flex-none">Edit store</Link>
          </>}
        </div>
      </div>
      {shareErr && <p role="alert" className="mt-2 text-sm text-red-700">{shareErr}</p>}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/70">
        <span><b className="text-ink">{v.sales}</b> sales</span>
        <span className="flex items-center gap-1"><Star size={14} />{v.rating ? `${v.rating.toFixed(1)} from ${v.review_count} reviews` : "No reviews yet"}</span>
        {v.address && <span className="flex items-center gap-1"><MapPin size={14} />{v.address}</span>}
      </div>
      {v.bio && <p className="mt-3 max-w-2xl text-sm">{v.bio}</p>}
      <div className="mt-5"><VendorCard v={v} /></div>
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Reviews</h2>
        {v.reviews.length === 0 ? <p className="text-sm text-ink/60">No reviews yet.</p> : <ul className="space-y-3">
          {v.reviews.map((review) => <li key={review.id} className="card p-4">
            <p className="text-sm font-semibold">{review.reviewer_name} · {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            {review.comment && <p className="mt-1 whitespace-pre-line text-sm text-ink/70">{review.comment}</p>}
          </li>)}
        </ul>}
      </section>
      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Listings</h2>
      {v.products.length === 0 ? <p className="card p-5 text-sm text-ink/70">No active listings.</p>
        : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{v.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </>
  );
}
