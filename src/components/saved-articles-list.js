"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NewsCard } from "@/components/news-card";

const SAVED_ARTICLES_STORAGE_KEY = "lightfeed_saved_articles_v1";

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
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) return null;

  try {
    const hostname = new URL(safeUrl).hostname.toLowerCase().replace(/\.$/, "");
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

function toSourceImageUrl(sourceImage, sourceUrl, articleLink) {
  const domain = toSafeHostname(sourceUrl) ?? toSafeHostname(articleLink);
  return toLogoDevUrl(domain) ?? toSafeHttpUrl(sourceImage);
}

function getSourceKey(article) {
  return String(
    article?.sourceFeedId ||
      `${article?.sourceTitle || "unknown"}::${article?.sourceUrl || article?.feedUrl || article?.link || article?.id}`,
  );
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

function buildSources(articles) {
  const sources = [];
  const sourceKeys = new Set();
  let sourceOrdinal = 0;

  for (const article of articles) {
    const sourceKey = getSourceKey(article);
    if (!sourceKey || sourceKeys.has(sourceKey)) continue;

    sourceKeys.add(sourceKey);
    sourceOrdinal += 1;

    sources.push({
      id: sourceKey,
      ordinal: sourceOrdinal,
      title: article.sourceTitle || "Unknown source",
      imageUrl: toSourceImageUrl(
        article.sourceImage,
        article.sourceUrl,
        article.link,
      ),
    });
  }

  return sources;
}

export function SavedArticlesList() {
  const [articles, setArticles] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      const saved = loadSavedArticles();
      setArticles(saved);
      setIsLoaded(true);
    }

    syncFromStorage();

    function handleStorage(event) {
      if (!event.key || event.key === SAVED_ARTICLES_STORAGE_KEY) {
        syncFromStorage();
      }
    }

    function handleSavedArticlesChanged() {
      syncFromStorage();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      "lightfeed:saved-articles-changed",
      handleSavedArticlesChanged,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "lightfeed:saved-articles-changed",
        handleSavedArticlesChanged,
      );
    };
  }, []);

  const sources = useMemo(() => buildSources(articles), [articles]);

  useEffect(() => {
    if (!selectedSource) return;
    const stillExists = sources.some((source) => source.id === selectedSource);
    if (!stillExists) {
      setSelectedSource(null);
    }
  }, [selectedSource, sources]);

  const filteredArticles = useMemo(() => {
    if (!selectedSource) return articles;
    return articles.filter((article) => getSourceKey(article) === selectedSource);
  }, [articles, selectedSource]);

  const sourceCountsList = useMemo(() => {
    const sourceCounts = new Map();
    const countBase = selectedSource ? filteredArticles : articles;

    for (const article of countBase) {
      const sourceKey = getSourceKey(article);
      const title = article.sourceTitle || "Unknown source";
      const entry = sourceCounts.get(sourceKey) ?? {
        key: sourceKey,
        title,
        count: 0,
      };
      entry.count += 1;
      sourceCounts.set(sourceKey, entry);
    }

    return Array.from(sourceCounts.values()).sort((a, b) => b.count - a.count);
  }, [articles, filteredArticles, selectedSource]);

  const totalArticlesAcrossSources = sourceCountsList.reduce(
    (sum, source) => sum + Number(source.count || 0),
    0,
  );

  const activeSource = sources.find((source) => source.id === selectedSource);
  const activeSourceTitle = activeSource?.title || selectedSource;
  const visibleSourceCount = selectedSource ? 1 : sources.length;
  const visibleSourceLabel = visibleSourceCount === 1 ? "source" : "sources";

  function handleRemoved(articleLink) {
    setArticles((previousArticles) =>
      previousArticles.filter((article) => article.link !== articleLink),
    );
  }

  function handleClearAll() {
    if (typeof window === "undefined" || articles.length === 0) return;

    const confirmed = window.confirm(
      `Remove all ${articles.length} saved ${
        articles.length === 1 ? "article" : "articles"
      } from this browser?`,
    );

    if (!confirmed) return;

    window.localStorage.removeItem(SAVED_ARTICLES_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("lightfeed:saved-articles-changed"));
    setArticles([]);
    setSelectedSource(null);
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
              Saved For Later
            </h2>
          </div>

          {isLoaded && articles.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold underline text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
              title="Remove all saved articles"
            >
              Clear all bookmarks
            </button>
          ) : null}
        </div>

        {isLoaded ? (
          <>
            {sources.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-row items-center gap-2">
                  {sources.map((source) => {
                    const isActive = selectedSource === source.id;
                    const isDimmed = selectedSource && !isActive;

                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() =>
                          setSelectedSource((current) =>
                            current === source.id ? null : source.id,
                          )
                        }
                        title={
                          isActive
                            ? `${source.title} #${source.ordinal} (click to clear)`
                            : `Show only ${source.title} #${source.ordinal}`
                        }
                        aria-label={`${source.title} ${source.ordinal}`}
                        className={`relative block h-8 w-8 overflow-visible transition ${
                          isDimmed ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <div
                          className={`h-8 w-8 overflow-hidden rounded-md ${
                            isActive ? "ring-2 ring-stone-500" : ""
                          }`}
                        >
                          {source.imageUrl ? (
                            <img
                              src={source.imageUrl}
                              alt={source.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center rounded-md bg-stone-200 text-xs font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-100">
                              {source.title.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <span className="absolute -right-1 -top-1 min-w-[1rem] rounded-full bg-stone-900 px-1 text-center text-[10px] leading-4 text-white dark:bg-stone-100 dark:text-stone-900">
                          {source.ordinal}
                        </span>
                      </button>
                    );
                  })}

                  {selectedSource ? (
                    <button
                      type="button"
                      className="ml-2 text-xs underline text-stone-600 dark:text-stone-300"
                      onClick={() => setSelectedSource(null)}
                      title="Clear source filter"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                {sourceCountsList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                    {sourceCountsList.map((s) => {
                      const sourceMeta = sources.find(
                        (source) => source.id === s.key,
                      );
                      return (
                        <span key={s.key} className="whitespace-nowrap">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {s.count}
                          </span>
                          {" · "}
                          {s.title}
                          {sourceMeta ? ` #${sourceMeta.ordinal}` : ""}
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <div className="text-xs text-stone-600 dark:text-stone-400">
                  {selectedSource ? (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {filteredArticles.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {filteredArticles.length}
                      </span>{" "}
                      from{" "}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {activeSourceTitle}
                        {activeSource ? ` #${activeSource.ordinal}` : ""}
                      </span>{" "}
                      ·{" "}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {visibleSourceCount}
                      </span>{" "}
                      {visibleSourceLabel}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {totalArticlesAcrossSources}
                      </span>{" "}
                      saved{" "}
                      {totalArticlesAcrossSources === 1 ? "article" : "articles"}{" "}
                      ·{" "}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {visibleSourceCount}
                      </span>{" "}
                      {visibleSourceLabel}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs uppercase tracking-[0.1em] text-stone-600 dark:text-stone-300">
                {articles.length} saved{" "}
                {articles.length === 1 ? "article" : "articles"}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-stone-600 dark:text-stone-300">
            Loading saved articles…
          </p>
        )}
      </div>

      {!isLoaded ? null : filteredArticles.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-6 dark:border-stone-700 dark:bg-stone-900/70">
          <p className="text-center text-sm text-stone-700 dark:text-stone-300">
            {selectedSource
              ? "No saved articles for this source."
              : "You have no saved articles yet."}
          </p>
          {selectedSource ? (
            <div className="mt-3 text-center">
              <Link
                href="/saved"
                className="text-xs underline text-stone-600 dark:text-stone-300"
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedSource(null);
                }}
              >
                Clear filter
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-8">
          {filteredArticles.map((article) => (
            <NewsCard
              key={article.id || article.link}
              article={article}
              initialIsSaved
              actionMode="remove-only"
              onRemoved={handleRemoved}
            />
          ))}
        </ul>
      )}
    </section>
  );
}