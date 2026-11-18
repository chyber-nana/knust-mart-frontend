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
