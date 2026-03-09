"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeQuickToggle } from "@/components/theme-quick-toggle";
import LucideIcon from "@/components/lucide-icon";
import {
  Home,
  Newspaper,
  Bookmark,
  Settings,
  GripVertical,
} from "lucide";

const PAGE_ORDER_COOKIE = "lightfeed_page_order";
const COOKIE_MAX_AGE = 31536000; // 1 year

function normalizePathname(pathname) {
  const safePathname = String(pathname ?? "").trim() || "/";
  if (safePathname !== "/" && safePathname.endsWith("/")) {
    return safePathname.slice(0, -1);
  }
  return safePathname;
}

function isFeedPageActive(pathname, pageId) {
  const pagePath = `/feeds/${pageId}`;
  return (
    pathname === pagePath ||
    pathname === `/settings/feeds/${pageId}/edit`
  );
}

function movePageToTarget(pages, sourceId, targetId) {
  const sourceIndex = pages.findIndex((page) => page.id === sourceId);
  const targetIndex = pages.findIndex((page) => page.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return pages;
  }

  const nextPages = [...pages];
  const [movedPage] = nextPages.splice(sourceIndex, 1);
  nextPages.splice(targetIndex, 0, movedPage);

  return nextPages;
}

function readCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name, value) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function normalizePages(pages) {
  if (!Array.isArray(pages)) {
    return [];
  }

  return pages.filter(
    (page) => page && typeof page.id === "string" && typeof page.name === "string",
  );
}

function readSavedOrderIds() {
  try {
    const raw = readCookie(PAGE_ORDER_COOKIE);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
  } catch (_error) {
    return [];
  }
}

function applySavedOrder(pages, savedOrderIds) {
  if (!savedOrderIds.length) {
    return pages;
  }

  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const seen = new Set();
  const ordered = [];

  for (const id of savedOrderIds) {
    const page = pageMap.get(id);

    if (!page || seen.has(id)) {
      continue;
    }

    ordered.push(page);
    seen.add(id);
  }

  for (const page of pages) {
    if (!seen.has(page.id)) {
      ordered.push(page);
    }
  }

  return ordered;
}

function MenuLink({ href, children, isActive }) {
  const baseClass =
    "flex items-center gap-2 block rounded-md px-3 py-2 text-sm font-medium text-stone-700 no-underline transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100";
  const activeClass = "bg-stone-200 dark:bg-stone-800";
  const className = isActive ? `${baseClass} ${activeClass}` : baseClass;

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShellSidebarNav({ pages }) {
  const pathname = normalizePathname(usePathname());
  const defaultPages = useMemo(() => normalizePages(pages), [pages]);
  const [orderedPages, setOrderedPages] = useState(defaultPages);
  const [dragState, setDragState] = useState({
    sourceId: "",
    targetId: "",
  });

  useEffect(() => {
    const savedOrderIds = readSavedOrderIds();
    setOrderedPages(applySavedOrder(defaultPages, savedOrderIds));
  }, [defaultPages]);

  const persistPageOrder = (nextPages) => {
    setOrderedPages(nextPages);
    writeCookie(
      PAGE_ORDER_COOKIE,
      JSON.stringify(nextPages.map((page) => page.id)),
    );
  };

  const handleDragStart = (event, pageId) => {
    if (orderedPages.length < 2) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pageId);

    setDragState({
      sourceId: pageId,
      targetId: pageId,
    });
  };

  const handleDragOver = (event, pageId) => {
    if (!dragState.sourceId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dragState.targetId !== pageId) {
      setDragState((current) => ({
        ...current,
        targetId: pageId,
      }));
    }
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();

    const sourceId = dragState.sourceId;

    setDragState({
      sourceId: "",
      targetId: "",
    });

    if (!sourceId || sourceId === targetId) {
      return;
    }

    const nextPages = movePageToTarget(orderedPages, sourceId, targetId);

    if (nextPages === orderedPages) {
      return;
    }

    persistPageOrder(nextPages);
  };

  const handleDragEnd = () => {
    setDragState({
      sourceId: "",
      targetId: "",
    });
  };

  return (
    <>
      <nav className="mt-5 space-y-1">
        <MenuLink href="/" isActive={pathname === "/"}>
          <LucideIcon icon={Home} />
          Home
        </MenuLink>
        <MenuLink href="/saved" isActive={pathname === "/saved"}>
          <LucideIcon icon={Bookmark} />
          Saved For Later
        </MenuLink>
        <MenuLink
          href="/settings"
          isActive={pathname === "/settings" || pathname.startsWith("/settings/")}
        >
          <LucideIcon icon={Settings} />
          Settings
        </MenuLink>
      </nav>

      <div className="mt-6">
        <span className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-300">
          Feeds
        </span>
        <div className="mt-2 space-y-1">
          {orderedPages.map((page) => (
            <div
              key={page.id}
              draggable={orderedPages.length > 1}
              onDragStart={(event) => handleDragStart(event, page.id)}
              onDragOver={(event) => handleDragOver(event, page.id)}
              onDrop={(event) => handleDrop(event, page.id)}
              onDragEnd={handleDragEnd}
              className={[
                "rounded-md transition group",
                dragState.targetId === page.id && dragState.sourceId !== page.id
                  ? "bg-sky-100/70 dark:bg-sky-900/30"
                  : "",
                dragState.sourceId === page.id ? "opacity-70" : "",
              ].join(" ")}
            >
              <MenuLink
                href={`/feeds/${page.id}`}
                isActive={isFeedPageActive(pathname, page.id)}
              >
                {page.isHomepage ? (
                  <LucideIcon icon={Home} size={12} />
                ) : (
                  <LucideIcon icon={Newspaper} size={12} />
                )}
                <span className="flex-1 truncate">{page.name}</span>
                <LucideIcon
                  icon={GripVertical}
                  size={12}
                  className="hidden group-hover:block cursor-grab text-stone-400 dark:text-stone-500"
                />
              </MenuLink>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-start">
        <ThemeQuickToggle />
      </div>

      <p className="mt-6 text-xs text-stone-600 dark:text-stone-300">
        Premium-quality, free forever, and open source.
      </p>

      <hr className="mt-3 mb-2 border-stone-200 dark:border-stone-800" />
      <p className="text-xs text-stone-500 dark:text-stone-300">
        Logos by{" "}
        <a
          href="https://logo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
        >
          logo.dev
        </a>
      </p>
    </>
  );
}