import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function readTheme() {
  const saved = localStorage.getItem("theme");
  return saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new CustomEvent("knust-theme-change", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const next = (event as CustomEvent<"dark" | "light">).detail;
      if (next === "dark" || next === "light") setTheme(next);
    };
    window.addEventListener("knust-theme-change", syncTheme);
    return () => window.removeEventListener("knust-theme-change", syncTheme);
  }, []);

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink/70 transition hover:text-brand"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
