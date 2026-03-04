"use client";

import { useMemo, useState } from "react";
import { NewsFeedList } from "@/components/news-feed-list";

export function FeedSourceFilter({
  sources,
  articles,
  pageContext,
  savedArticleLinks,
  fetchedAt,
  trackingKey,
}) {
  const [activeSourceId, setActiveSourceId] = useState(null);

  const filteredArticles = useMemo(() => {
    if (!activeSourceId) return articles;
    return articles.filter((a) => {
      // must match the id/key logic you used on the server
      const sourceDomain = (a.sourceUrl || "").toLowerCase();
      return (
        a.sourceFeedId === activeSourceId ||
        a.sourceUrl === activeSourceId ||
        sourceDomain.includes(activeSourceId)
      );
    });
  }, [articles, activeSourceId]);

  const toggle = (id) => {
    setActiveSourceId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {sources?.length > 0 && (
        <div className="mt-2 flex flex-row items-center gap-2">
          {sources.map((source) => {
            const isActive = activeSourceId === source.id;
            const isDimmed = activeSourceId && !isActive;

            return (
              <button
                key={source.id}
                type="button"
                onClick={() => toggle(source.id)}
                title={
                  activeSourceId
                    ? isActive
                      ? `${source.title} (click to clear)`
                      : source.title
                    : source.title
                }
                aria-label={source.title}
                className={`block h-8 w-8 overflow-hidden rounded-md transition ${
                  isDimmed ? "opacity-30" : "opacity-100"
                } ${isActive ? "ring-2 ring-stone-500" : ""}`}
              >
                {source.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
              </button>
            );
          })}

          {activeSourceId && (
            <button
              type="button"
              onClick={() => setActiveSourceId(null)}
              className="ml-2 text-xs underline text-stone-600 dark:text-stone-300"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <NewsFeedList
        articles={filteredArticles}
        pageContext={pageContext}
        savedArticleLinks={savedArticleLinks}
        fetchedAt={fetchedAt}
        trackingKey={trackingKey}
      />
    </>
  );
}