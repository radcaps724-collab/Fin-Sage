"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "finsage-theme";

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : getSystemTheme();

    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    if (storedTheme !== "light" && storedTheme !== "dark") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (event: MediaQueryListEvent) => {
        const nextTheme: Theme = event.matches ? "dark" : "light";
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    return;
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Toggle light and dark mode"
      onClick={toggleTheme}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
