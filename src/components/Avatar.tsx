import { mediaUrl } from "../api";

export default function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-9 w-9 text-sm", md: "h-14 w-14 text-lg", lg: "h-24 w-24 text-3xl" };
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-[30%] border border-white/80 bg-[#e6ebdf] font-display font-bold text-brand ring-1 ring-line/70 ${sizes[size]}`}>
      {src ? <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
    </div>
  );
}
