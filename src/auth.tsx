import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface Me { id: string; full_name: string; user_type: string; is_courier: boolean; is_verified_student: boolean; is_admin: boolean }
interface Ctx { me: Me | null; appealOnly: boolean; loading: boolean; login: (e: string, p: string) => Promise<boolean>; completeAuth: (token: string) => Promise<void>; logout: () => void; refresh: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [appealOnly, setAppealOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    if (!localStorage.getItem("token")) { setMe(null); setAppealOnly(false); return; }
    try {
      setMe(await api<Me>("/auth/me"));
      setAppealOnly(false);
    } catch {
      try {
        await api("/appeals");
        setMe(null);
        setAppealOnly(true);
      } catch {
        localStorage.removeItem("token");
        setMe(null);
        setAppealOnly(false);
      }
    }
  };
  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);
  const login = async (email: string, password: string) => {
    const r = await api<{ access_token: string; scope?: string }>("/auth/login", { method: "POST", body: { email, password } });
    if (r.scope === "appeal") {
      localStorage.setItem("token", r.access_token);
      setMe(null);
      setAppealOnly(true);
      return true;
    }
    await completeAuth(r.access_token);
    return false;
  };
  const completeAuth = async (token: string) => {
    localStorage.setItem("token", token);
    await refresh();
  };
  const logout = () => { localStorage.removeItem("token"); setMe(null); setAppealOnly(false); };
  return <AuthCtx.Provider value={{ me, appealOnly, loading, login, completeAuth, logout, refresh }}>{children}</AuthCtx.Provider>;
}
