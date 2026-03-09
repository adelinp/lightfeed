"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide";
import LucideIcon from "@/components/lucide-icon";

const COOKIE_NAME = "lightfeed_page_order";
const COOKIE_MAX_AGE = 31536000; // 1 year

function readCookie(name) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function normalizePages(pages) {
  if (!Array.isArray(pages)) return [];
  return pages.filter((page) => page && page.id && page.name);
}

function buildOrderedPages(defaultPages, savedOrderIds) {
  const pages = normalizePages(defaultPages);
  if (!savedOrderIds.length) return pages;

  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const ordered = [];
  const seen = new Set();

  for (const id of savedOrderIds) {
    const page = pageMap.get(id);
    if (!page || seen.has(id)) continue;
    ordered.push(page);
    seen.add(id);
  }

  for (const page of pages) {
    if (!seen.has(page.id)) {
      ordered.push(page);
      seen.add(page.id);
    }
  }

  return ordered;
}

function readSavedOrderIds() {
  try {
    const raw = readCookie(COOKIE_NAME);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string" && value.trim())
      : [];
  } catch (_error) {
    return [];
  }
}

function moveItem(list, fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length ||
    fromIndex === toIndex
  ) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function FeedOrderSettingsControl({ pages }) {
  const defaultPages = useMemo(() => normalizePages(pages), [pages]);
  const [orderedPages, setOrderedPages] = useState(defaultPages);
  const [status, setStatus] = useState({
    ready: false,
    message: "",
  });

  useEffect(() => {
    const savedOrderIds = readSavedOrderIds();
    const nextPages = buildOrderedPages(defaultPages, savedOrderIds);
    setOrderedPages(nextPages);
    setStatus({
      ready: true,
      message: "",
    });
  }, [defaultPages]);

  const persistOrder = (nextPages) => {
    setOrderedPages(nextPages);
    writeCookie(
      COOKIE_NAME,
      JSON.stringify(nextPages.map((page) => page.id)),
    );
    setStatus({
      ready: true,
      message: "Feed order saved for this device.",
    });
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    persistOrder(moveItem(orderedPages, index, index - 1));
  };

  const moveDown = (index) => {
    if (index >= orderedPages.length - 1) return;
    persistOrder(moveItem(orderedPages, index, index + 1));
  };

  const resetOrder = () => {
    deleteCookie(COOKIE_NAME);
    setOrderedPages(defaultPages);
    setStatus({
      ready: true,
      message: "Feed order reset to the default order.",
    });
  };

  return (
    <div className="rounded-xl border border-stone-900/8 bg-white/70 p-4 dark:border-stone-100/15 dark:bg-stone-900/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950 dark:text-stone-100">
            Feed order
          </p>
          <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
            Customize the order of feeds shown in the left menu on this device.
          </p>
        </div>

        <button
          type="button"
          onClick={resetOrder}
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <LucideIcon icon={RotateCcw} size={14} />
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {orderedPages.map((page, index) => (
          <div
            key={page.id}
            className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 dark:border-stone-700 dark:bg-stone-900/70"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                {page.name}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {page.isHomepage ? "Homepage feed" : "Custom feed"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                aria-label={`Move ${page.name} up`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                <LucideIcon icon={ArrowUp} size={14} />
              </button>

              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === orderedPages.length - 1}
                aria-label={`Move ${page.name} down`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                <LucideIcon icon={ArrowDown} size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {status.ready ? (
        <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
          {status.message || "The default database order is used until you change it here."}
        </p>
      ) : null}
    </div>
  );
}