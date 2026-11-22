import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./components/Toast";
import { RealtimeProvider } from "./realtime";
import WakeGate from "./components/WakeGate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><WakeGate><ToastProvider><BrowserRouter><AuthProvider><RealtimeProvider><App /></RealtimeProvider></AuthProvider></BrowserRouter></ToastProvider></WakeGate></React.StrictMode>
);

// Register the service worker on every visit: it is what lets the browser offer "Install app" and deliver notifications.
if ("serviceWorker" in navigator) window.addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js").catch(() => undefined); });
