"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const eventName = "auditor-theme-change";

function getTheme(): Theme { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function subscribe(onChange: () => void) {
  window.addEventListener(eventName, onChange);
  return () => window.removeEventListener(eventName, onChange);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("auditor-theme"); } catch { /* preference storage may be disabled */ }
    const preferred: Theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = preferred;
    window.dispatchEvent(new Event(eventName));
  }, []);

  function select(next: Theme) {
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("auditor-theme", next); } catch { /* theme still works for this page */ }
    window.dispatchEvent(new Event(eventName));
  }

  const dark = theme === "dark";
  return <button
    type="button"
    className="theme-switch focus-ring"
    onClick={() => select(dark ? "light" : "dark")}
    aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    title={dark ? "Switch to light mode" : "Switch to dark mode"}
  >
    {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
  </button>;
}
