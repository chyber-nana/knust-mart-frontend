import { NavLink, Navigate, Outlet } from "react-router-dom";
import { Award, LayoutDashboard, LifeBuoy, Megaphone, Users } from "lucide-react";
import { useAuth } from "../auth";

const FEATURES = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/appeals", label: "Appeals", icon: LifeBuoy },
  { to: "/admin/ads", label: "Flyers", icon: Megaphone },
  { to: "/admin/badges", label: "Badges", icon: Award },
];

export default function AdminShell() {
  const { me } = useAuth();
  if (!me?.is_admin) return <Navigate to="/" replace />;
  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Admin features" className="sticky top-0 z-20 -mx-4 mb-5 border-b border-line bg-paper/95 px-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-2">
        <ul className="no-scrollbar flex gap-1 overflow-x-auto py-2">
          {FEATURES.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${isActive ? "bg-brand text-white" : "text-ink/65 hover:bg-[#e6ebdf] hover:text-ink"}`}>
                <Icon size={15} aria-hidden="true" />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
