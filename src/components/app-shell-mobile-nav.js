"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeQuickToggle } from "@/components/theme-quick-toggle";
import Logo from "@/app/assets/logo";
import LucideIcon from "@/components/lucide-icon";
import {
  Bookmark,
  Home,
  Menu,
  Newspaper,
  Settings,
  X,
  RotateCcw,
  Info,
} from "lucide";

const PAGE_ORDER_COOKIE = "lightfeed_page_order";

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

function readCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function deleteCookie(name) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
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

function MobileMenuLink({ href, children, isActive, onNavigate }) {
  const baseClass =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-stone-700 no-underline transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100";
  const activeClass = "bg-stone-200 dark:bg-stone-800";
  const className = isActive ? `${baseClass} ${activeClass}` : baseClass;

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShellMobileNav({ pages }) {
  const pathname = normalizePathname(usePathname());
  const [isOpen, setIsOpen] = useState(false);
  const defaultPages = useMemo(() => normalizePages(pages), [pages]);
  const [orderedPages, setOrderedPages] = useState(defaultPages);

  useEffect(() => {
    const savedOrderIds = readSavedOrderIds();
    setOrderedPages(applySavedOrder(defaultPages, savedOrderIds));
  }, [defaultPages]);

  const resetFeedOrder = () => {
    deleteCookie(PAGE_ORDER_COOKIE);
    setOrderedPages(defaultPages);
  };

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-900/8 bg-white/70 p-3 dark:border-stone-100/15 dark:bg-stone-900/70">
        <Link
          href="/"
          aria-label="LightFeed home"
          className="text-2xl font-semibold tracking-tight text-stone-950 no-underline dark:text-stone-100"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeQuickToggle />
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-300 px-3 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <LucideIcon icon={isOpen ? X : Menu} size={14} />
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="mobile-nav-menu"
          className="mt-2 rounded-xl border border-stone-900/8 bg-white/85 p-3 dark:border-stone-100/15 dark:bg-stone-900/80"
        >
          <nav className="space-y-1">
            <MobileMenuLink
              href="/"
              isActive={pathname === "/"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Home} />
              Home
            </MobileMenuLink>
            <MobileMenuLink
              href="/saved"
              isActive={pathname === "/saved"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Bookmark} />
              Saved For Later
            </MobileMenuLink>
            <MobileMenuLink
              href="/settings"
              isActive={pathname === "/settings" || pathname.startsWith("/settings/")}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Settings} />
              Settings
            </MobileMenuLink>
            <MobileMenuLink
              href="/about"
              isActive={pathname === "/about"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Info} />
              About
            </MobileMenuLink>
          </nav>

          <div className="mt-4">
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-300">
                Feeds
              </span>

              <button
                type="button"
                onClick={resetFeedOrder}
                title="Reset order"
                aria-label="Reset order"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                <LucideIcon icon={RotateCcw} size={14} />
              </button>
            </div>

            <div className="mt-2 space-y-1">
              {orderedPages.map((page) => (
                <MobileMenuLink
                  key={page.id}
                  href={`/feeds/${page.id}`}
                  isActive={isFeedPageActive(pathname, page.id)}
                  onNavigate={() => setIsOpen(false)}
                >
                  {page.isHomepage ? (
                    <LucideIcon icon={Home} size={12} />
                  ) : (
                    <LucideIcon icon={Newspaper} size={12} />
                  )}
                  {page.name}
                </MobileMenuLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}