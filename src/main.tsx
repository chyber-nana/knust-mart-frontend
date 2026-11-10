import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./components/Toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ToastProvider><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></ToastProvider></React.StrictMode>
);
