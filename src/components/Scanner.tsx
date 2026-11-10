import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onCode }: { onCode: (token: string) => void }) {
  const [err, setErr] = useState("");
  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    let handled = false;
    scanner
      .start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => { if (!handled) { handled = true; onCode(text); } }, () => {})
      .catch(() => setErr("Camera unavailable (it needs HTTPS or localhost). Use the PIN instead."));
    return () => { (scanner.isScanning ? scanner.stop() : Promise.resolve()).then(() => scanner.clear()).catch(() => {}); };
  }, []);
  return <div><div id="qr-reader" className="overflow-hidden rounded-md" />{err && <p className="mt-2 text-sm text-red-700">{err}</p>}</div>;
}
