"use client";

import { Moon, Sun } from "lucide";
import LucideIcon from "@/components/lucide-icon";
import { useTheme } from "@/components/theme-provider";

export function ThemeQuickToggle({ className = "" }) {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-full",
        "border border-stone-300 bg-white/80 text-stone-700 shadow-sm",
        "transition hover:bg-stone-100 hover:text-stone-900",
        "dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50",
        className,
      ].join(" ")}
    >
      <LucideIcon icon={isDark ? Sun : Moon} size={16} />
    </button>
  );
}