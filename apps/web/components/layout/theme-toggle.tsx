"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const eventName = "veripoc-theme-change";

function getTheme(): Theme { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function subscribe(onChange: () => void) {
  window.addEventListener(eventName, onChange);
  return () => window.removeEventListener(eventName, onChange);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("veripoc-theme"); } catch { /* preference storage may be disabled */ }
    const preferred: Theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = preferred;
    window.dispatchEvent(new Event(eventName));
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("veripoc-theme", next); } catch { /* theme still works for this page */ }
    window.dispatchEvent(new Event(eventName));
  }

  return <button type="button" className="theme-toggle focus-ring" onClick={toggle}
    aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    aria-pressed={theme === "dark"} title={theme === "light" ? "Dark theme" : "Light theme"}>
    {theme === "light" ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
  </button>;
}
