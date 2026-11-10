import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, KeyRound, LogOut, Truck } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import ThemeToggle from "../components/ThemeToggle";

export default function Settings() {
  const { me, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current_password: currentPassword, new_password: newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-gold">Account</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Settings</h1>
      </header>

      <section className="card flex items-center justify-between gap-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-xs text-ink/60">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="card divide-y divide-line overflow-hidden">
        <Link to={`/vendors/${me?.id}`} className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Building2 size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">My storefront</span><span className="text-xs text-ink/60">View your public store</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
        <Link to="/store/edit" className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Building2 size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">Edit storefront</span><span className="text-xs text-ink/60">Update your business details and banner</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
        <Link to="/courier" className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Truck size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">Courier</span><span className="text-xs text-ink/60">{me?.is_courier ? "Manage delivery jobs" : "Join the student courier network"}</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
      </section>

      <form onSubmit={changePassword} className="card space-y-3 p-4 sm:p-5">
        <div className="flex items-center gap-2"><KeyRound size={18} className="text-brand" /><h2 className="font-display text-lg font-bold">Change password</h2></div>
        <label className="block space-y-1 text-sm"><span className="font-medium">Current password</span><input className="input" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">New password</span><input className="input" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><span className="block text-xs text-ink/55">At least 8 characters.</span></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">Confirm new password</span><input className="input" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="text-sm text-brand">{message}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>

      <button type="button" onClick={logout} className="btn-ghost w-full text-red-700"><LogOut size={17} />Sign out</button>
    </div>
  );
}
