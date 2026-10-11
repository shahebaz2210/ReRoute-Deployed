"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Application is designed in a light tone: cards, tables, inputs are light tone, only small components (buttons, badges) are dark
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Reset and enforce light tone
    setThemeState("light");
    setResolvedTheme("light");
    try {
      localStorage.setItem("dispatchx-theme", "light");
    } catch {}

    const root = document.documentElement;
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }, []);

  const setTheme = (newTheme: Theme) => {
    // If user explicitly toggles theme, keep it light tone focused
    setThemeState(newTheme);
    try {
      localStorage.setItem("dispatchx-theme", newTheme);
    } catch {}

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      setResolvedTheme("dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      setResolvedTheme("light");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
