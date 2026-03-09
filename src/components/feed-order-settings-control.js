"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw, Save } from "lucide";
import LucideIcon from "@/components/lucide-icon";

function normalizePages(pages) {
  if (!Array.isArray(pages)) return [];
  return pages.filter((page) => page && page.id && page.name);
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
    error: "",
    saving: false,
  });

  useEffect(() => {
    setOrderedPages(defaultPages);
    setStatus({
      ready: true,
      message: "",
      error: "",
      saving: false,
    });
  }, [defaultPages]);

  const moveUp = (index) => {
    if (index <= 0 || status.saving) return;
    setOrderedPages((current) => moveItem(current, index, index - 1));
    setStatus((current) => ({
      ...current,
      message: "",
      error: "",
    }));
  };

  const moveDown = (index) => {
    if (index >= orderedPages.length - 1 || status.saving) return;
    setOrderedPages((current) => moveItem(current, index, index + 1));
    setStatus((current) => ({
      ...current,
      message: "",
      error: "",
    }));
  };

  const resetOrder = () => {
    if (status.saving) return;

    setOrderedPages(defaultPages);
    setStatus({
      ready: true,
      message: "Unsaved changes were discarded.",
      error: "",
      saving: false,
    });
  };

  const saveOrder = async () => {
    if (status.saving) return;

    setStatus({
      ready: true,
      message: "",
      error: "",
      saving: true,
    });

    try {
      const response = await fetch("/api/feeds", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIds: orderedPages.map((page) => page.id),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save default feed order.");
      }

      const nextPages = Array.isArray(payload?.data)
        ? normalizePages(payload.data)
        : orderedPages;

      setOrderedPages(nextPages);
      setStatus({
        ready: true,
        message: "Default feed order saved for everyone.",
        error: "",
        saving: false,
      });
    } catch (error) {
      setStatus({
        ready: true,
        message: "",
        error:
          error instanceof Error
            ? error.message
            : "Unable to save default feed order.",
        saving: false,
      });
    }
  };

  return (
    <div className="rounded-xl border border-stone-900/8 bg-white/70 p-4 dark:border-stone-100/15 dark:bg-stone-900/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950 dark:text-stone-100">
            Default feed order
          </p>
          <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
            Save the default feed order used across the application for everyone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetOrder}
            disabled={status.saving}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <LucideIcon icon={RotateCcw} size={14} />
            Reset
          </button>

          <button
            type="button"
            onClick={saveOrder}
            disabled={status.saving}
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            <LucideIcon icon={Save} size={14} />
            {status.saving ? "Saving..." : "Save"}
          </button>
        </div>
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
                disabled={index === 0 || status.saving}
                aria-label={`Move ${page.name} up`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                <LucideIcon icon={ArrowUp} size={14} />
              </button>

              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === orderedPages.length - 1 || status.saving}
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
          {status.error ||
            status.message ||
            "This saves the default database order used for all users."}
        </p>
      ) : null}
    </div>
  );
}