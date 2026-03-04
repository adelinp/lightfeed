"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "lightfeed_items_per_feed";
const DEFAULT_LIMIT = 24;
const MIN = 5;
const MAX = 200;

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name, value) {
  // 1 year, site-wide
  document.cookie = `${name}=${encodeURIComponent(
    String(value)
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function clampInt(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(MIN, Math.min(MAX, Math.floor(v)));
}

export function ArticleLimitSettingsControl() {
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  useEffect(() => {
    const fromCookie = readCookie(COOKIE_NAME);
    setLimit(clampInt(fromCookie, DEFAULT_LIMIT));
  }, []);

  const onChange = (e) => {
    const next = clampInt(e.target.value, DEFAULT_LIMIT);
    setLimit(next);
    writeCookie(COOKIE_NAME, next);
  };

  return (
    <div className="rounded-xl border border-stone-900/8 bg-white/70 p-4 dark:border-stone-100/15 dark:bg-stone-900/60">
      <p className="text-sm font-semibold text-stone-950 dark:text-stone-100">
        Articles per feed
      </p>
      <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
        Controls how many articles are blended and shown on each feed page.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={limit}
          onChange={onChange}
          className="w-28 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
        />
        <span className="text-xs text-stone-600 dark:text-stone-400">
          min {MIN}, max {MAX}
        </span>
      </div>
    </div>
  );
}