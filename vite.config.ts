import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const keyPath = process.env.VITE_HTTPS_KEY;
const certPath = process.env.VITE_HTTPS_CERT;
if (Boolean(keyPath) !== Boolean(certPath)) {
  throw new Error("Set both VITE_HTTPS_KEY and VITE_HTTPS_CERT to enable HTTPS.");
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST ?? (keyPath ? "0.0.0.0" : "127.0.0.1"),
    ...(keyPath && certPath ? {
      https: {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
    } : {}),
  },
});
