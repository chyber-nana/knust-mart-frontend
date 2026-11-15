import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Building2, FileText, KeyRound, LogOut, Truck } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import PasswordChecklist, { isStrongPassword } from "../components/PasswordChecklist";
import ThemeToggle from "../components/ThemeToggle";

export default function Settings() {
  const { me, logout } = useAuth();
  const [location, setLocation] = useState(me?.hostel_or_business_address ?? "");
  const [phone, setPhone] = useState(me?.phone_number ?? "");
  const [whatsapp, setWhatsapp] = useState(me?.whatsapp_number ?? "");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState("");
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
    if (!isStrongPassword(newPassword)) {
      setError("Your new password does not meet all the requirements yet.");
      return;
    }
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

  const saveContacts = async (event: FormEvent) => {
    event.preventDefault();
    setContactBusy(true);
    setContactMessage("");
    setContactError("");
    try {
      await api("/vendors/me/contacts", {
        method: "PATCH",
        body: {
          phone_number: phone,
          whatsapp_number: whatsapp,
          hostel_or_business_address: location,
        },
      });
      setContactMessage("Seller contact details updated.");
    } catch (cause) {
      setContactError((cause as Error).message);
    } finally {
      setContactBusy(false);
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
        <Link to={me?.store_active ? "/store/edit" : "/store/create"} className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Building2 size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">{me?.store_active ? "Edit storefront" : "Create your business"}</span><span className="text-xs text-ink/60">{me?.store_active ? "Update your business details and banner" : "Open a storefront and sell as a business"}</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
        <Link to="/courier" className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Truck size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">Courier</span><span className="text-xs text-ink/60">{me?.is_courier ? "Manage delivery jobs" : "Join the student courier network"}</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
        <Link to="/terms" className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <FileText size={19} className="text-brand" />
          <span className="flex-1"><span className="block text-sm font-semibold">Terms and Conditions</span><span className="text-xs text-ink/60">Review the current terms and business rules</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>
        {me?.is_admin && <Link to="/admin/badges" className="flex items-center gap-3 p-4 transition hover:bg-paper">
          <Award size={19} className="text-gold" />
          <span className="flex-1"><span className="block text-sm font-semibold">Manage user badges</span><span className="text-xs text-ink/60">Assign or revoke community badges</span></span>
          <span aria-hidden="true" className="text-ink/40">›</span>
        </Link>}
      </section>

      <form onSubmit={saveContacts} className="card space-y-3 p-4 sm:p-5">
        <div><h2 className="font-display text-lg font-bold">Seller contact details</h2><p className="mt-1 text-xs text-ink/60">Buyers can use these details from your storefront and product pages.</p></div>
        <label className="block space-y-1 text-sm"><span className="font-medium">Pickup or business location</span><input className="input" placeholder="Hall, hostel, or pickup spot" maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} /><span className="block text-xs text-ink/55">This is shown to buyers choosing in-person pickup.</span></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">Phone number</span><input className="input" type="tel" autoComplete="tel" placeholder="+233…" maxLength={32} value={phone} onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)} /></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">WhatsApp number</span><input className="input" type="tel" placeholder="+233…" maxLength={32} value={whatsapp} onChange={(event: ChangeEvent<HTMLInputElement>) => setWhatsapp(event.target.value)} /><span className="block text-xs text-ink/55">Include your country code.</span></label>
        {contactError && <p role="alert" className="text-sm text-red-700">{contactError}</p>}
        {contactMessage && <p role="status" className="text-sm text-brand">{contactMessage}</p>}
        <button type="submit" className="btn-primary" disabled={contactBusy}>{contactBusy ? "Saving…" : "Save contact details"}</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-3 p-4 sm:p-5">
        <div className="flex items-center gap-2"><KeyRound size={18} className="text-brand" /><h2 className="font-display text-lg font-bold">Change password</h2></div>
        <label className="block space-y-1 text-sm"><span className="font-medium">Current password</span><input className="input" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">New password</span><input className="input" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
        <PasswordChecklist password={newPassword} />
        <label className="block space-y-1 text-sm"><span className="font-medium">Confirm new password</span><input className="input" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />{confirmPassword && newPassword !== confirmPassword && <span className="block text-xs text-red-700">Passwords do not match yet.</span>}</label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="text-sm text-brand">{message}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>

      <button type="button" onClick={logout} className="btn-ghost w-full text-red-700"><LogOut size={17} />Sign out</button>
    </div>
  );
}
