"use client";

import { useEffect, useMemo, useState } from "react";
import { NewsCard } from "@/components/news-card";

const LAST_REFRESH_BY_FEED_STORAGE_KEY = "lightfeed:last-refresh-by-feed:v1";

function toTimestampMs(rawValue) {
  const parsedValue = Date.parse(String(rawValue ?? ""));
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function toArticleFeedKey(article, fallbackKey) {
  const sourceFeedId = String(article?.sourceFeedId ?? "").trim();
  if (sourceFeedId) {
    return `feed:${sourceFeedId}`;
  }

  const sourceUrl = String(article?.sourceUrl ?? "").trim();
  if (sourceUrl) {
    return `source-url:${sourceUrl}`;
  }

  return `scope:${fallbackKey}`;
}

function parseStoredRefreshMap(rawValue) {
  try {
    const parsedValue = JSON.parse(rawValue ?? "{}");
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue).flatMap(([feedKey, value]) => {
        const timestamp = toTimestampMs(value);
        if (!feedKey || timestamp === null) {
          return [];
        }

        return [[feedKey, timestamp]];
      }),
    );
  } catch {
    return {};
  }
}

export function NewsFeedList({
  articles,
  pageContext = null,
  savedArticleLinks = [],
  fetchedAt = null,
  trackingKey = "default",
  className = "space-y-8",
}) {
  const [previousRefreshByFeedMs, setPreviousRefreshByFeedMs] = useState({});
  const [isTrackingReady, setIsTrackingReady] = useState(false);
  const savedArticleLinksSet = useMemo(
    () => new Set(savedArticleLinks),
    [savedArticleLinks],
  );
  const currentRefreshAtMs = useMemo(() => toTimestampMs(fetchedAt), [fetchedAt]);
  const currentFeedKeys = useMemo(
    () =>
      Array.from(
        new Set(articles.map((article) => toArticleFeedKey(article, trackingKey))),
      ),
    [articles, trackingKey],
  );

  useEffect(() => {
    let storedRefreshByFeedMs = {};

    try {
      storedRefreshByFeedMs = parseStoredRefreshMap(
        window.localStorage.getItem(LAST_REFRESH_BY_FEED_STORAGE_KEY),
      );
    } catch {
      storedRefreshByFeedMs = {};
    }

    // localStorage is only available post-hydration; this initializes tracker state safely.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviousRefreshByFeedMs(storedRefreshByFeedMs);
    setIsTrackingReady(true);

    if (!currentRefreshAtMs) {
      return;
    }

    if (currentFeedKeys.length === 0) {
      return;
    }

    const nextStoredRefreshByFeedMs = { ...storedRefreshByFeedMs };
    const currentRefreshAtIso = new Date(currentRefreshAtMs).toISOString();
    for (const feedKey of currentFeedKeys) {
      nextStoredRefreshByFeedMs[feedKey] = currentRefreshAtIso;
    }

    try {
      window.localStorage.setItem(
        LAST_REFRESH_BY_FEED_STORAGE_KEY,
        JSON.stringify(nextStoredRefreshByFeedMs),
      );
    } catch {
      // Ignore storage write failures (private mode, storage disabled, etc).
    }
  }, [currentFeedKeys, currentRefreshAtMs]);

  const rows = useMemo(
    () =>
      articles.map((article) => {
        const publishedAtMs = Number(article.publishedAtMs);
        const feedKey = toArticleFeedKey(article, trackingKey);
        const previousRefreshAtMs =
          previousRefreshByFeedMs[feedKey] ?? null;
        const hasPreviousRefresh =
          isTrackingReady && previousRefreshAtMs !== null;
        const hasPublishedDate =
          Number.isFinite(publishedAtMs) && publishedAtMs > 0;
        const isNewSinceRefresh =
          hasPreviousRefresh &&
          hasPublishedDate &&
          publishedAtMs > previousRefreshAtMs;

        return {
          article,
          hasPreviousRefresh,
          isNewSinceRefresh,
        };
      }),
    [articles, isTrackingReady, previousRefreshByFeedMs, trackingKey],
  );

  const hasPreviousRefresh = rows.some((row) => row.hasPreviousRefresh);

  const newArticleCount = useMemo(
    () => rows.filter((row) => row.isNewSinceRefresh).length,
    [rows],
  );

  return (
    <>
      <ul className={className}>
        {rows.map(({ article, isNewSinceRefresh }) => (
          <NewsCard
            key={article.id}
            article={article}
            pageContext={pageContext}
            initialIsSaved={savedArticleLinksSet.has(article.link)}
            isNewSinceRefresh={isNewSinceRefresh}
          />
        ))}
      </ul>
    </>
  );
}
