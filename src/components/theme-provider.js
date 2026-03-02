"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lightfeed-theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext(null);

function normalizeThemeMode(rawTheme) {
  const value = String(rawTheme ?? "").trim().toLowerCase();
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

function readSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches;
}

function resolveTheme(themeMode, systemPrefersDark) {
  if (themeMode === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return themeMode;
}

function applyResolvedTheme(resolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.setAttribute("data-theme", resolvedTheme);
}

function readInitialThemeMode() {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    return normalizeThemeMode(window.localStorage.getItem(STORAGE_KEY));
  } catch (_error) {
    return "system";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readInitialThemeMode());
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    readSystemPrefersDark(),
  );
  const resolvedTheme = resolveTheme(theme, systemPrefersDark);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY);
    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_error) {
      // Ignore storage errors so theme toggling still works.
    }
  }, [theme, resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        setTheme(normalizeThemeMode(nextTheme));
      },
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
