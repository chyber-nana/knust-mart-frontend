import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api, Card, mediaUrl, Meta } from "../api";
import BusinessCard, { Business } from "../components/BusinessCard";
import CampusAdCarousel from "../components/CampusAdCarousel";
import ProductCard from "../components/ProductCard";
import ProductQuickView from "../components/ProductQuickView";

type Filters = { q: string; category: string; condition: string; location: string; max_price: string; sellers: "all" | "student" };

export default function Browse() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [filters, setFilters] = useState<Filters>({ q: "", category: "", condition: "", location: "", max_price: "", sellers: "all" });
  const [products, setProducts] = useState<Card[] | null>(null);
  const [quickView, setQuickView] = useState<Card | null>(null);
  const [trending, setTrending] = useState<Business[]>([]);
  const [popular, setPopular] = useState<Business[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filterPopupLayout, setFilterPopupLayout] = useState<{ placement: "above" | "below"; maxHeight: number; rightOffset: number } | null>(null);
  const [err, setErr] = useState("");
  const [vendorErr, setVendorErr] = useState("");
  const [productErr, setProductErr] = useState("");
  const trendingRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const closeQuickView = useCallback(() => setQuickView(null), []);

  useEffect(() => {
    api<Meta>("/products/meta").then(setMeta).catch((e) => setErr(e.message));
    api<Business[]>("/vendors?sort=trending").then(setTrending).catch((e) => setVendorErr(e.message));
    api<Business[]>("/vendors?sort=popular").then(setPopular).catch((e) => setVendorErr(e.message));
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchFocused(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const updatePopupLayout = () => {
      const button = filterButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 24;
      const stickyHeader = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const spaceAbove = rect.top - Math.max(24, stickyHeader + 12);
      const placement = spaceBelow < 360 && spaceAbove > spaceBelow ? "above" : "below";
      const availableHeight = placement === "above" ? spaceAbove : spaceBelow;
      const popupWidth = Math.min(window.innerWidth * 0.9, 370);
      const popupLeft = Math.max(12, Math.min(rect.right - popupWidth, window.innerWidth - popupWidth - 12));
      setFilterPopupLayout({
        placement,
        maxHeight: Math.max(160, Math.min(560, availableHeight)),
        rightOffset: rect.right - popupLeft - popupWidth,
      });
    };
    updatePopupLayout();
    window.addEventListener("resize", updatePopupLayout);
    window.addEventListener("scroll", updatePopupLayout, true);
    return () => {
      window.removeEventListener("resize", updatePopupLayout);
      window.removeEventListener("scroll", updatePopupLayout, true);
    };
  }, [filterOpen]);

  useEffect(() => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value && value !== "all") query.set(key, value); });
    let cancelled = false;
    setProductsLoading(true);
    const timer = window.setTimeout(() => {
      api<Card[]>(`/products?${query}`)
        .then((result) => {
          if (cancelled) return;
          setProductErr("");
          setProducts(result);
        })
        .catch((e) => {
          if (cancelled) return;
          setProductErr(e.message);
          setProducts(null);
        })
        .finally(() => { if (!cancelled) setProductsLoading(false); });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters]);

  const activeFilters = useMemo(() => Object.entries(filters)
    .filter(([key, value]) => value && key !== "q" && !(key === "sellers" && value === "all"))
    .map(([key, value]) => ({ key: key as keyof Filters, label: key === "max_price" ? `Under GH₵${value}` : key === "sellers" ? "Student sellers" : value })), [filters]);
  const update = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value } as Filters));
  const change = (key: keyof Filters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update(key, event.target.value);
  const moveCarousel = (direction: -1 | 1) => trendingRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });

  return (
    <div className="space-y-6 pb-8">
      <section className="market-hero relative z-20 rounded-[1.65rem] border border-line bg-[#e8eddf] px-4 py-5 sm:px-8 sm:py-7 lg:px-11">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[34px] border-white/40 sm:h-72 sm:w-72" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="max-w-xl font-display text-2xl font-bold leading-[1.06] tracking-[-.045em] sm:text-4xl">Marketplace</h1>
          <div className="relative mt-4" ref={searchRef}>
            <div className="flex items-center gap-2 rounded-2xl border border-white/90 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-brand/50">
              <Search size={19} className="ml-2 shrink-0 text-ink/45" />
              <input aria-label="Search products" aria-expanded={searchFocused && filters.q.trim().length > 0} aria-controls="product-search-suggestions" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-ink/40 focus:ring-0" placeholder="Find books, electronics, room essentials…" value={filters.q} onFocus={() => setSearchFocused(true)} onChange={change("q")} />
              <div className="relative" ref={filterRef}>
              <button
                ref={filterButtonRef}
                type="button"
                aria-expanded={filterOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setFilterOpen((open) => !open);
                  setSearchFocused(false);
                }}
                className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${filterOpen ? "bg-brand text-white" : "bg-paper text-ink hover:bg-line/60"}`}
                title="Open filters"
              >
                <SlidersHorizontal size={17} />
                {activeFilters.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">{activeFilters.length}</span>}
              </button>
              {filterOpen && <div role="dialog" aria-label="Listing filters" className={`filter-popover absolute z-30 w-[min(90vw,370px)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-4 shadow-xl ${filterPopupLayout?.placement === "above" ? "bottom-[calc(100%+12px)]" : "top-[calc(100%+12px)]"}`} style={{ maxHeight: filterPopupLayout?.maxHeight, right: filterPopupLayout?.rightOffset ?? 0 }}>
                <div className="mb-4 flex items-center justify-between">
                  <div><h2 className="font-display text-lg font-bold">Filters</h2></div>
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper" aria-label="Close filters" onClick={() => setFilterOpen(false)}><X size={17} /></button>
                </div>
                <FilterGroup label="Condition">
                  {meta?.conditions.map((condition) => <FilterPill key={condition} active={filters.condition === condition} onClick={() => update("condition", filters.condition === condition ? "" : condition)}>{condition}</FilterPill>)}
                </FilterGroup>
                <FilterGroup label="Where">
                  {meta?.locations.map((location) => <FilterPill key={location} active={filters.location === location} onClick={() => update("location", filters.location === location ? "" : location)}>{location}</FilterPill>)}
                </FilterGroup>
                <FilterGroup label="Seller">
                  <FilterPill active={filters.sellers === "student"} onClick={() => update("sellers", filters.sellers === "student" ? "all" : "student")}>Student sellers</FilterPill>
                </FilterGroup>
                <FilterGroup label="Maximum price">
                  {[50, 100, 250, 500].map((price) => <FilterPill key={price} active={filters.max_price === String(price)} onClick={() => update("max_price", filters.max_price === String(price) ? "" : String(price))}>GH₵{price}</FilterPill>)}
                  <input aria-label="Custom maximum price" className="h-8 w-24 rounded-full border border-line px-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand" type="number" min="0" placeholder="Custom…" value={filters.max_price && ![50, 100, 250, 500].includes(Number(filters.max_price)) ? filters.max_price : ""} onChange={change("max_price")} />
                </FilterGroup>
                <div className="mt-4 flex justify-between border-t border-line pt-3">
                  <button type="button" className="text-sm font-semibold text-ink/60 hover:text-ink" onClick={() => setFilters((current) => ({ ...current, condition: "", location: "", max_price: "", sellers: "all" }))}>Clear filters</button>
                  <button type="button" className="btn-primary px-4 py-2" onClick={() => setFilterOpen(false)}>Show listings <ArrowRight size={15} /></button>
                </div>
              </div>}
              </div>
            </div>
            {searchFocused && filters.q.trim() && <div id="product-search-suggestions" role="listbox" aria-label="Product suggestions" className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
              {productsLoading && <p className="px-3 py-4 text-sm text-ink/55">Searching…</p>}
              {!productsLoading && products?.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  role="option"
                  aria-selected="false"
                  onClick={(event) => {
                    event.preventDefault();
                    setSearchFocused(false);
                    setQuickView(product);
                  }}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-paper focus:bg-paper focus:outline-none"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                    {product.image && <img src={mediaUrl(product.image)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.title}</p>
                    <p className="truncate text-xs text-ink/55">{product.category === "Services" ? "Service" : [product.hall_location, product.condition].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand">GH₵{product.price.toFixed(2)}</span>
                </Link>
              ))}
              {!productsLoading && products?.length === 0 && <p className="px-3 py-4 text-sm text-ink/55">No products found.</p>}
            </div>}
          </div>
          {(activeFilters.length > 0 || filters.q) && <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.q && <FilterPill active onClick={() => update("q", "")}>“{filters.q}” <X size={12} /></FilterPill>}
            {activeFilters.map((filter) => <FilterPill key={filter.key} active onClick={() => update(filter.key, filter.key === "sellers" ? "all" : "")}>{filter.label} <X size={12} /></FilterPill>)}
            {activeFilters.length > 1 && <button className="px-1 text-xs font-semibold text-ink/50 underline underline-offset-2" onClick={() => setFilters((current) => ({ ...current, condition: "", location: "", max_price: "", sellers: "all" }))}>Clear all</button>}
          </div>}
        </div>
      </section>

      <CampusAdCarousel />

      <section className="animate-rise">
        <div className="mb-3 flex items-end justify-between">
          <SectionHeading title="Categories" />
          {filters.category && <button className="text-xs font-semibold text-brand" onClick={() => update("category", "")}>Show all</button>}
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button onClick={() => update("category", "")} className={`category-pill ${!filters.category ? "category-pill-active" : ""}`}>Everything</button>
          {meta?.categories.map((category, index) => <button key={category} onClick={() => update("category", filters.category === category ? "" : category)} className={`category-pill ${filters.category === category ? "category-pill-active" : ""}`} style={{ animationDelay: `${index * 45}ms` }}>{category}</button>)}
          {!meta && [1, 2, 3, 4].map((key) => <span key={key} className="h-10 w-28 animate-pulse rounded-full bg-line/60" />)}
        </div>
      </section>

      <section className="animate-rise">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <SectionHeading title={filters.category || "Fresh finds"} />
        </div>
        {(err || productErr) && <p role="alert" className="mb-3 text-sm text-red-700">{productErr || err}</p>}
        {products === null && !productErr ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4].map((key) => <div key={key} className="h-64 animate-pulse rounded-[1.25rem] bg-line/50" />)}</div>
          : products?.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-10 text-center">
            <p className="font-display text-lg font-bold">Nothing matches just yet</p>
            <button className="mt-4 text-sm font-semibold text-brand underline underline-offset-4" onClick={() => setFilters({ q: "", category: "", condition: "", location: "", max_price: "", sellers: "all" })}>Reset search</button>
          </div>
          : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{products?.map((product, index) => <div key={product.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}><ProductCard p={product} onClick={() => setQuickView(product)} /></div>)}</div>}
      </section>

      <section className="animate-rise">
        <SectionHeading title="Trending around KNUST" />
        <div className="group relative">
          <div ref={trendingRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-1">
            {trending.map((business) => <BusinessCard key={business.id} business={business} featured />)}
            {trending.length === 0 && !vendorErr && <LoadingBusinessCards />}
            {trending.length === 0 && vendorErr && <p className="card w-full p-5 text-sm text-red-700">{vendorErr}</p>}
          </div>
          {trending.length > 1 && <>
            <button type="button" aria-label="Previous trending stores" onClick={() => moveCarousel(-1)} className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-sm transition hover:bg-paper group-hover:grid"><ArrowLeft size={17} /></button>
            <button type="button" aria-label="Next trending stores" onClick={() => moveCarousel(1)} className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-sm transition hover:bg-paper group-hover:grid"><ArrowRight size={17} /></button>
          </>}
        </div>
      </section>

      <section>
        <SectionHeading title="Popular businesses" />
        {vendorErr && <p className="mb-3 text-sm text-red-700">{vendorErr}</p>}
        {popular.length === 0 && !vendorErr
          ? <LoadingBusinessCards grid />
          : popular.length === 0 ? <p className="card p-5 text-sm text-ink/60">No storefronts yet.</p>
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((business, index) => <div key={business.id} className="animate-rise" style={{ animationDelay: `${index * 55}ms` }}><BusinessCard business={business} /></div>)}</div>}
      </section>
      {products && products.length > 0 && <div className="flex justify-center pt-2"><button className="btn-ghost rounded-full px-6" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>You’re all caught up <ArrowDown size={14} className="rotate-180" /></button></div>}
      {quickView && <ProductQuickView product={quickView} meta={meta} onClose={closeQuickView} />}
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <div className="mb-4"><h2 className="font-display text-2xl font-bold tracking-[-.03em] sm:text-[1.7rem]">{title}</h2></div>;
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset className="mb-3"><legend className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink/55">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>;
}

function FilterPill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`filter-pill ${active ? "filter-pill-active" : ""}`}>{active && typeof children === "string" && <Check size={12} />}{children}</button>;
}

function LoadingBusinessCards({ grid = false }: { grid?: boolean }) {
  const items = [1, 2, 3];
  return <div className={grid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex gap-4 overflow-hidden"}>
    {items.map((key) => <div key={key} className={`shrink-0 animate-pulse overflow-hidden rounded-[1.4rem] border border-line bg-white ${grid ? "" : "w-[min(82vw,24rem)] sm:w-[22rem]"}`}>
      <div className="h-28 bg-line/50" /><div className="space-y-2 p-4"><div className="h-4 w-2/3 rounded bg-line/70" /><div className="h-3 w-full rounded bg-line/50" /><div className="h-3 w-1/2 rounded bg-line/50" /></div>
    </div>)}
  </div>;
}
