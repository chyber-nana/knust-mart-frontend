import { useEffect, useState } from "react";
import { api, Meta } from "./api";
import { useAuth } from "./auth";

let cached: { courier: boolean; escrow: boolean } | null = null;

/** Feature switches set on the server (COURIER_ENABLED / ESCROW_ENABLED). Admins always see everything, so they can test before launch. */
export function useFlags() {
  const { me } = useAuth();
  const [f, setF] = useState(cached);
  useEffect(() => {
    if (cached) return;
    api<Meta>("/products/meta").then((m) => { cached = { courier: !!m.courier_enabled, escrow: !!m.escrow_enabled }; setF(cached); }).catch(() => undefined);
  }, []);
  const admin = !!me?.is_admin;
  return { ready: f !== null, courier: admin || !!f?.courier, escrow: admin || !!f?.escrow };
}
