"use client";

import React from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
          theme === "light"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        }`}
        aria-label="Light mode"
        aria-pressed={theme === "light"}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
          theme === "dark"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        }`}
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
          theme === "system"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        }`}
        aria-label="System mode"
        aria-pressed={theme === "system"}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">System</span>
      </button>
    </div>
  );
}
