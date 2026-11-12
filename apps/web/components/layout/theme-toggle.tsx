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

  function select(next: Theme) {
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("veripoc-theme", next); } catch { /* theme still works for this page */ }
    window.dispatchEvent(new Event(eventName));
  }

  return <div className="theme-switch" role="group" aria-label="Color theme">
    <button type="button" className="focus-ring" onClick={() => select("light")} aria-pressed={theme === "light"}><Sun size={14} aria-hidden="true" /> Paper</button>
    <button type="button" className="focus-ring" onClick={() => select("dark")} aria-pressed={theme === "dark"}><Moon size={14} aria-hidden="true" /> Charcoal</button>
  </div>;
}
