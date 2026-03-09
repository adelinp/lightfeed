/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import LucideIcon from "./lucide-icon";
import { Bookmark, ExternalLink } from "lucide";
import { useArchiveLinksPreference } from "@/components/use-archive-links-preference";

const SAVED_ARTICLES_STORAGE_KEY = "lightfeed_saved_articles_v1";
const MAX_SAVED_ARTICLES = 30;

function getButtonVariant({ mode, isSaved }) {
  if (mode === "remove-only") {
    return "secondary";
  }
  if (isSaved) {
    return "secondary";
  }
  return "secondary";
}

function getButtonLabel({ mode, isSaved, isPending }) {
  if (isPending) {
    return mode === "remove-only" ? "Removing..." : "Saving...";
  }

  if (mode === "remove-only") {
    return "Remove from bookmarks";
  }

  return isSaved ? "Remove from bookmarks" : "Bookmark";
}

function toSafeHttpUrl(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function toSafeHostname(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, "");
    return hostname.replace(/^www\./i, "") || null;
  } catch {
    return null;
  }
}

function getLogoDomainOverrides() {
  const raw = String(process.env.NEXT_PUBLIC_LOGO_DOMAIN_OVERRIDES ?? "").trim();
  const map = new Map();

  if (!raw) return map;

  for (const pair of raw.split(",")) {
    const [from, to] = pair
      .split("=")
      .map((v) => String(v ?? "").trim().toLowerCase());
    if (from && to) map.set(from, to);
  }

  return map;
}

function applyLogoDomainOverride(domain) {
  if (!domain) return null;
  const overrides = getLogoDomainOverrides();
  return overrides.get(domain.toLowerCase()) || domain;
}

function toLogoDevUrl(domain) {
  const effectiveDomain = applyLogoDomainOverride(domain);
  if (!effectiveDomain) return null;

  const token = String(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? "").trim();
  const params = new URLSearchParams({
    size: "96",
    format: "webp",
    fallback: "404",
  });

  if (token) {
    params.set("token", token);
  }

  return `https://img.logo.dev/${encodeURIComponent(effectiveDomain)}?${params.toString()}`;
}

function isRedditHostname(hostname) {
  const value = String(hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!value) return false;

  return value === "reddit.com" || value.endsWith(".reddit.com");
}

function toRedditSubredditLabelFromUrl(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) return null;

  try {
    const parsed = new URL(safeUrl);
    if (!isRedditHostname(parsed.hostname)) {
      return null;
    }

    const pathParts = parsed.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    const rIndex = pathParts.findIndex((part) => part.toLowerCase() === "r");
    if (rIndex === -1 || !pathParts[rIndex + 1]) {
      return null;
    }

    const subreddit = decodeURIComponent(pathParts[rIndex + 1]).replace(
      /\.rss$/i,
      "",
    );
    if (!subreddit) {
      return null;
    }

    return `r/${subreddit}`;
  } catch {
    return null;
  }
}

function toRedditSubredditLabel({ sourceUrl, link, sourceTitle }) {
  const subredditFromSourceUrl = toRedditSubredditLabelFromUrl(sourceUrl);
  if (subredditFromSourceUrl) {
    return subredditFromSourceUrl;
  }

  const subredditFromLinkUrl = toRedditSubredditLabelFromUrl(link);
  if (subredditFromLinkUrl) {
    return subredditFromLinkUrl;
  }

  if (!isRedditHostname(toSafeHostname(sourceUrl))) {
    return null;
  }

  const match = String(sourceTitle ?? "").match(/\br\/([A-Za-z0-9_+.-]+)/i);
  if (!match) {
    return null;
  }

  return `r/${match[1]}`;
}

function detectMediaType(mediaUrl) {
  if (!mediaUrl) return null;

  const path = mediaUrl.split("?")[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(path)) {
    return "video";
  }

  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(path)) {
    return "image";
  }

  return "image";
}

function toArchiveIsUrl(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) {
    return rawValue;
  }

  return `https://archive.is/newest/${encodeURIComponent(safeUrl)}`;
}

function toPaywallSkipUrl(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) {
    return rawValue;
  }

  return `https://www.paywallskip.com/article?url=${encodeURIComponent(safeUrl)}`;
}

function normalizeArticleForSave(article, pageContext = null) {
  return {
    id: article?.id ?? article?.link,
    link: article?.link,
    title: article?.title ?? "",
    summary: article?.summary ?? "",
    imageUrl: article?.imageUrl ?? null,
    sourceTitle: article?.sourceTitle ?? "Unknown source",
    sourceUrl: article?.sourceUrl ?? null,
    sourceImage: article?.sourceImage ?? null,
    sourceFeedId: article?.sourceFeedId ?? null,
    publishedLabel: article?.publishedLabel ?? null,
    pageContext: pageContext ?? null,
    savedAt: Date.now(),
  };
}

function loadSavedArticles() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_ARTICLES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (article) =>
        article &&
        typeof article === "object" &&
        typeof article.link === "string" &&
        article.link.trim(),
    );
  } catch {
    return [];
  }
}

function writeSavedArticles(articles) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SAVED_ARTICLES_STORAGE_KEY,
    JSON.stringify(articles),
  );

  window.dispatchEvent(new CustomEvent("lightfeed:saved-articles-changed"));
}

function isArticleSavedInList(articles, articleLink) {
  return articles.some((item) => item.link === articleLink);
}

export function NewsCard({
  article,
  pageContext = null,
  initialIsSaved = false,
  actionMode = "save-toggle",
  onRemoved,
  isNewSinceRefresh = false,
}) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const openWithArchive = useArchiveLinksPreference();
  const sourceDomain = toSafeHostname(article.sourceUrl) ?? toSafeHostname(article.link);
  const sourceLabel = article.sourceTitle || sourceDomain || "Unknown feed";
  const redditSubredditLabel = toRedditSubredditLabel({
    sourceUrl: article.sourceUrl,
    link: article.link,
    sourceTitle: article.sourceTitle,
  });
  const sourceLogoUrl = toLogoDevUrl(sourceDomain);
  const safePreviewMediaUrl = toSafeHttpUrl(article.imageUrl);
  const previewMediaType = detectMediaType(safePreviewMediaUrl);
  const [isSourceLogoVisible, setIsSourceLogoVisible] = useState(
    Boolean(sourceLogoUrl),
  );
  const [isPreviewMediaVisible, setIsPreviewMediaVisible] = useState(
    Boolean(safePreviewMediaUrl),
  );

  const buttonLabel = getButtonLabel({ mode: actionMode, isSaved, isPending });
  const archiveHref = useMemo(() => toArchiveIsUrl(article.link), [article.link]);
  const paywallSkipHref = useMemo(() => toPaywallSkipUrl(article.link), [article.link]);

  const articleHref = useMemo(() => {
    return openWithArchive ? archiveHref : article.link;
  }, [openWithArchive, archiveHref, article.link]);

  const imageLinkLabel = article.title ? `Open article: ${article.title}` : "Open article";

  useEffect(() => {
    function syncSavedState() {
      const savedArticles = loadSavedArticles();
      setIsSaved(isArticleSavedInList(savedArticles, article.link));
    }

    syncSavedState();

    function handleStorage(event) {
      if (!event.key || event.key === SAVED_ARTICLES_STORAGE_KEY) {
        syncSavedState();
      }
    }

    function handleSavedArticlesChanged() {
      syncSavedState();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("lightfeed:saved-articles-changed", handleSavedArticlesChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "lightfeed:saved-articles-changed",
        handleSavedArticlesChanged,
      );
    };
  }, [article.link]);

  if (isHidden) {
    return null;
  }

  async function handleSaveToggle() {
    if (isPending) return;

    setErrorMessage("");
    setIsPending(true);

    const shouldRemove = actionMode === "remove-only" || isSaved;

    try {
      const existing = loadSavedArticles();

      if (shouldRemove) {
        const updated = existing.filter((item) => item.link !== article.link);
        writeSavedArticles(updated);
        setIsSaved(false);

        if (actionMode === "remove-only") {
          setIsHidden(true);
          onRemoved?.(article.link);
        }

        return;
      }

      const normalizedArticle = normalizeArticleForSave(article, pageContext);
      const deduped = existing.filter((item) => item.link !== article.link);
      const updated = [normalizedArticle, ...deduped].slice(0, MAX_SAVED_ARTICLES);

      writeSavedArticles(updated);
      setIsSaved(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update saved article.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <li className="rounded-xl bg-white p-4 shadow-xl shadow-transparent transition-all hover:shadow-stone-200 md:p-5 dark:bg-stone-900/80 dark:hover:shadow-stone-900/40">
      <article className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <div className="flex min-w-0 items-center gap-3">
            {sourceLogoUrl && isSourceLogoVisible ? (
              <img
                src={sourceLogoUrl}
                alt={sourceLabel}
                title={sourceLabel}
                className="h-6 w-auto rounded-sm object-contain"
                loading="lazy"
                onError={() => setIsSourceLogoVisible(false)}
              />
            ) : (
              <span>{sourceLabel}</span>
            )}
            {redditSubredditLabel ? <span>{redditSubredditLabel}</span> : null}
            {article.publishedLabel ? (
              <span className="inline-flex items-center gap-2">
                <span>{article.publishedLabel}</span>
                {isNewSinceRefresh ? (
                  <span className="rounded-sm bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-950">
                    NEW
                  </span>
                ) : null}
              </span>
            ) : isNewSinceRefresh ? (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                NEW
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={articleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-2xl font-semibold leading-tight text-stone-950 hover:text-stone-700 hover:underline dark:text-stone-100 dark:hover:text-stone-300"
            >
              {article.title}
            </Link>

            {article.summary ? (
              <p className="mt-2 font-serif text-base leading-[150%] text-stone-700 dark:text-stone-300">
                {article.summary}
              </p>
            ) : null}
          </div>

          {safePreviewMediaUrl && isPreviewMediaVisible ? (
            previewMediaType === "video" ? (
              <div className="block aspect-[16/10] w-full overflow-hidden rounded-md lg:max-w-[240px]">
                <video
                  controls
                  preload="metadata"
                  className="h-full w-full object-cover"
                  onError={() => setIsPreviewMediaVisible(false)}
                >
                  <source src={safePreviewMediaUrl} />
                </video>
              </div>
            ) : (
              <Link
                href={articleHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={imageLinkLabel}
                className="group/image block aspect-[16/10] w-full overflow-hidden rounded-md no-underline lg:max-w-[240px]"
              >
                <img
                  src={safePreviewMediaUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover saturate-75"
                  onError={() => setIsPreviewMediaVisible(false)}
                />
              </Link>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {actionMode === "remove-only"
              ? "Saved article"
              : "Open the article or bookmark it for later."}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 text-xs"
              variant={openWithArchive ? "secondary" : "primary"}
            >
              <LucideIcon icon={ExternalLink} />
              Read Article
            </Button>

            <Button
              href={archiveHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 text-xs"
              variant={openWithArchive ? "primary" : "secondary"}
            >
              <LucideIcon icon={ExternalLink} />
              Read via archive.is
            </Button>

            <Button
              href={paywallSkipHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 text-xs"
              variant="secondary"
            >
              <LucideIcon icon={ExternalLink} />
              Read via PaywallSkip
            </Button>

            <Button
              onClick={handleSaveToggle}
              disabled={isPending}
              variant={getButtonVariant({ mode: actionMode, isSaved })}
              className="h-8 px-3 text-xs"
            >
              <LucideIcon icon={Bookmark} />
              {buttonLabel}
            </Button>
          </div>
        </div>
      </article>

      {errorMessage ? (
        <Alert tone="error" className="mt-3 text-xs">
          {errorMessage}
        </Alert>
      ) : null}
    </li>
  );
}