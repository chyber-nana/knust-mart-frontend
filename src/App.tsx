import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Building2, Compass, LogIn, Megaphone, MessageCircle, PackageCheck, Settings as SettingsIcon, Truck } from "lucide-react";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Appeals from "./pages/Appeals";
import AdminAppeals from "./pages/AdminAppeals";
import AdminAds from "./pages/AdminAds";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import ReviewOrder from "./pages/ReviewOrder";
import Browse from "./pages/Browse";
import ProductDetail from "./pages/ProductDetail";
import Sell from "./pages/Sell";
import Vendor from "./pages/Vendor";
import EditStore from "./pages/EditStore";
import Orders from "./pages/Orders";
import Receipt from "./pages/Receipt";
import CourierBoard from "./pages/CourierBoard";
import CourierActivity from "./pages/CourierActivity";
import ThemeToggle from "./components/ThemeToggle";
import NotificationCenter from "./components/NotificationCenter";
import OrderAlerts from "./components/OrderAlerts";
import Settings from "./pages/Settings";

function PublicLayout() {
  const { me, appealOnly, loading } = useAuth();
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
      });
    };
    updateProgress();
    const resizeObserver = new ResizeObserver(updateProgress);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".scroll-reveal, .animate-rise").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    const revealSelector = ".animate-rise, main section, main .card, main .product-card";
    const observe = (root: ParentNode) => {
      root.querySelectorAll(revealSelector).forEach((el) => {
        el.classList.add("scroll-reveal");
        revealObserver.observe(el);
      });
    };
    observe(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches(revealSelector)) {
            node.classList.add("scroll-reveal");
            revealObserver.observe(node);
          }
          observe(node);
        }
      }));
    });
    mutationObserver.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);
  const navClass = (path: string) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition duration-200 hover:-translate-y-0.5 ${location.pathname === path || (path === "/" && location.pathname.startsWith("/products")) ? "bg-brand/10 text-brand" : "text-ink/45 hover:bg-white/70 hover:text-ink"}`;
  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#1f5d3a] via-[#65bf88] to-[#e9ba4f] transition-transform duration-100" style={{ transform: `scaleX(${scrollProgress})` }} />
      <header className="site-header sticky top-0 z-40">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-4 px-4 sm:h-16 sm:px-8 lg:px-12">
          <Link to="/" className="group flex items-center gap-2 font-display text-lg font-bold tracking-tight text-brand sm:text-xl">
            <img
              src="https://vkhgvaencdidocddyorp.supabase.co/storage/v1/object/public/knust-mart/logo.jpg"
              alt=""
              className="h-9 w-9 shrink-0 rounded-[28%] object-contain transition duration-300 group-hover:rotate-[-7deg] group-hover:scale-110"
            />
            <span>KNUST <span className="text-ink">Mart</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {me && <NotificationCenter />}
            <Link to={me ? "/courier" : "/login"} state={!me ? { from: "/courier" } : undefined} aria-label="Courier" title="Courier" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white/80 transition hover:text-brand ${location.pathname === "/courier" ? "text-brand" : "text-ink/70"}`}><Truck size={17} /></Link>
            <ThemeToggle />
            {me?.is_admin && <Link to="/admin/appeals" className="hidden rounded-full px-3 py-2 text-xs font-semibold text-ink/60 transition hover:bg-white md:block">Admin</Link>}
            {me?.is_admin && <Link to="/admin/ads" aria-label="Manage campus flyers" title="Flyers" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white/80 text-ink/70 transition hover:-translate-y-0.5 hover:text-brand"><Megaphone size={16} /></Link>}
            {appealOnly && <Link to="/appeals" className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold">Account appeal</Link>}
            {loading ? <span className="h-8 w-16 animate-pulse rounded-full bg-line/60" /> : !me && !appealOnly
              ? <div className="flex items-center gap-2"><Link to="/login" className="rounded-full px-2 py-2 text-xs font-semibold text-ink/70 hover:text-ink sm:px-3">Sign in</Link><Link to="/register" className="rounded-full bg-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-brand/90 sm:px-4">Join campus</Link></div>
              : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-8 sm:py-7 lg:px-12"><Outlet /></main>
      {me && <OrderAlerts />}
      <nav aria-label="Main navigation" className="site-nav fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(28,27,23,.06)] backdrop-blur md:static md:mx-auto md:mt-4 md:flex md:w-full md:max-w-[1600px] md:justify-center md:gap-10 md:border-0 md:bg-transparent md:px-12 md:pb-4 md:pt-0 md:shadow-none">
        <div className="mx-auto flex max-w-md items-center justify-around md:max-w-none md:justify-center md:gap-10">
          <Link to="/" className={navClass("/")}><Compass size={19} /><span>Explore</span></Link>
          {me ? <>
            <div className="relative flex min-w-0 flex-col items-center">
              <Link to={`/vendors/${me.id}`} aria-label="My storefront" title="My storefront" className={navClass(`/vendors/${me.id}`)}><Building2 size={19} /><span>My store</span></Link>
            </div>
            <Link to="/inbox" className={navClass("/inbox")}><MessageCircle size={19} /><span>Inbox</span></Link>
            <Link to="/orders" className={navClass("/orders")}><PackageCheck size={19} /><span>Orders</span></Link>
            <Link to="/settings" className={navClass("/settings")}><SettingsIcon size={19} /><span>Settings</span></Link>
          </> : <>
            <Link to="/login" className={navClass("/login")}><LogIn size={19} /><span>Sign in</span></Link>
          </>}
        </div>
      </nav>
    </div>
  );
}

function RequireAuth() {
  const { me, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-6 text-sm">Loading…</p>;
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function StandaloneLayout() {
  return (
    <>
      <div className="fixed right-4 top-4 z-50"><ThemeToggle /></div>
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StandaloneLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/appeals" element={<Appeals />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Browse />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/vendors/:id" element={<Vendor />} />
        <Route element={<RequireAuth />}>
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/chat/:productId/:counterpartId" element={<Chat />} />
          <Route path="/admin/appeals" element={<AdminAppeals />} />
          <Route path="/admin/ads" element={<AdminAds />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/store/edit" element={<EditStore />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/orders/:id/review" element={<ReviewOrder />} />
          <Route path="/orders/:id" element={<Receipt />} />
          <Route path="/courier/history" element={<CourierActivity mode="history" />} />
          <Route path="/courier/payouts" element={<CourierActivity mode="payouts" />} />
          <Route path="/courier" element={<CourierBoard />} />
        </Route>
      </Route>
    </Routes>
  );
}
