/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Alert } from "@/components/alert";
import { AppShell } from "@/components/app-shell";
import { FeedGhostList } from "@/components/feed-ghost-list";
import { NewsFeedList } from "@/components/news-feed-list";
import { getPageById } from "@/lib/lightfeed-data";
import { getPageFeedStream } from "@/lib/rss-stream";
import { listSavedArticleLinksByLinks } from "@/lib/saved-articles-db";
import LucideIcon from "@/components/lucide-icon";
import { Settings } from "lucide";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "lightfeed_items_per_feed";
const DEFAULT_LIMIT = 24;
const MIN_LIMIT = 5;
const MAX_LIMIT = 200;
const TOTAL_FETCH_LIMIT = 1000;
const MAX_FILTER_FETCH = 800;
const FILTER_FETCH_MULTIPLIER = 12;

function clampLimit(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(v)));
}

function clampPage(n, fallback = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(1, Math.floor(v));
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
    const [from, to] = pair.split("=").map((v) => String(v ?? "").trim().toLowerCase());
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

  if (token) params.set("token", token);

  return `https://img.logo.dev/${encodeURIComponent(effectiveDomain)}?${params.toString()}`;
}

function toSourceImageUrl(sourceImage, sourceUrl) {
  const domain = toSafeHostname(sourceUrl);
  return toLogoDevUrl(domain) ?? toSafeHttpUrl(sourceImage);
}

function getSourceKey(article) {
  return String(
    article?.sourceFeedId ||
      `${article?.sourceTitle || "unknown"}::${article?.sourceUrl || article?.feedUrl || article?.link || article?.id}`,
  );
}

function buildFeedHref(pageId, { page, source } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/feeds/${pageId}?${qs}` : `/feeds/${pageId}`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) {
    return {
      title: "Feed Not Found",
      description: "The requested feed does not exist.",
    };
  }

  return {
    title: page.name,
    description: `Latest articles from the ${page.name} feed.`,
  };
}

export default async function FeedDetailPage({ params, searchParams }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) notFound();

  const sp = (await searchParams) ?? {};
  const pageNumber = clampPage(sp.page ?? 1, 1);

  const selectedSource =
    typeof sp.source === "string" && sp.source.trim()
      ? sp.source.trim()
      : null;

  return (
    <AppShell>
      <Suspense fallback={<FeedGhostList count={5} titleWidthClass="w-64" />}>
        <FeedDetailContent
          page={page}
          pageNumber={pageNumber}
          selectedSource={selectedSource}
        />
      </Suspense>
    </AppShell>
  );
}

async function FeedDetailContent({ page, pageNumber, selectedSource }) {
  const cookieStore = await cookies();
  const limitFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const limit = clampLimit(limitFromCookie, DEFAULT_LIMIT);

  const currentPage = clampPage(pageNumber, 1);
  const offset = (currentPage - 1) * limit;

  const baseNeed = offset + limit + 1;
  const fetchLimit = selectedSource
    ? Math.min(
        MAX_FILTER_FETCH,
        Math.max(baseNeed, baseNeed * FILTER_FETCH_MULTIPLIER),
      )
    : TOTAL_FETCH_LIMIT;

  const stream = await getPageFeedStream(page.id, { limit: fetchLimit });
  const allItems = stream.items ?? [];
  const feedErrors = stream.feedErrors ?? [];

  const filteredItems = selectedSource
    ? allItems.filter((a) => getSourceKey(a) === selectedSource)
    : allItems;

  const totalForDisplayWhenFiltered = filteredItems.length;

  if (currentPage > 1 && filteredItems.length <= offset) {
    redirect(buildFeedHref(page.id, { source: selectedSource || undefined }));
  }

  const hasMore = filteredItems.length > offset + limit;
  const blend = filteredItems.slice(offset, offset + limit);

  const sources = [];
  const sourceKeys = new Set();
  let sourceOrdinal = 0;

  for (const article of allItems) {
    const sourceKey = getSourceKey(article);
    if (!sourceKey || sourceKeys.has(sourceKey)) continue;

    sourceKeys.add(sourceKey);
    sourceOrdinal += 1;

    sources.push({
      id: sourceKey,
      ordinal: sourceOrdinal,
      title: article.sourceTitle || "Unknown source",
      imageUrl: toSourceImageUrl(article.sourceImage, article.sourceUrl),
    });
  }

  const sourceCounts = new Map();
  const countBase = selectedSource ? filteredItems : allItems;

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

  const sourceCountsList = Array.from(sourceCounts.values()).sort(
    (a, b) => b.count - a.count,
  );

  const totalArticlesAcrossSources = sourceCountsList.reduce(
    (sum, source) => sum + Number(source.count || 0),
    0,
  );

  const activeSource = sources.find((source) => source.id === selectedSource);
  const activeSourceTitle = activeSource?.title || selectedSource;

  const savedArticleLinks = listSavedArticleLinksByLinks(
    blend.map((article) => article.link),
  );

  const visibleSourceCount = selectedSource ? 1 : sources.length;
  const visibleSourceLabel = visibleSourceCount === 1 ? "source" : "sources";

  const totalAvailableLabel = selectedSource
    ? totalForDisplayWhenFiltered
    : totalArticlesAcrossSources;

  return (
    <>
      <section className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-center">
            <h2 className="mt-1 w-full font-serif text-4xl font-semibold tracking-tight text-stone-950 truncate dark:text-stone-100">
              {page.name}
            </h2>

            <Link
              className="flex items-center gap-2 font-bold text-xs hover:text-stone-700 dark:text-stone-300 dark:hover:text-stone-100"
              href={`/feeds/${page.id}/edit`}
            >
              <LucideIcon icon={Settings} />
              Settings
            </Link>
          </div>

          {sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2">
                {sources.map((source) => {
                  const isActive = selectedSource === source.id;
                  const isDimmed = selectedSource && !isActive;

                  return (
                    <Link
                      key={source.id}
                      href={
                        isActive
                          ? buildFeedHref(page.id)
                          : buildFeedHref(page.id, { source: source.id })
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
                    </Link>
                  );
                })}

                {selectedSource ? (
                  <Link
                    className="ml-2 text-xs underline text-stone-600 dark:text-stone-300"
                    href={buildFeedHref(page.id)}
                    title="Clear source filter"
                  >
                    Clear
                  </Link>
                ) : null}
              </div>

              {sourceCountsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                  {sourceCountsList.map((s) => {
                    const sourceMeta = sources.find((source) => source.id === s.key);
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
              )}

              <div className="text-xs text-stone-600 dark:text-stone-400">
                {selectedSource ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {blend.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {totalForDisplayWhenFiltered}
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
                    Showing{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {blend.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {totalArticlesAcrossSources}
                    </span>{" "}
                    articles ·{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {visibleSourceCount}
                    </span>{" "}
                    {visibleSourceLabel}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedSource && allItems.length >= MAX_FILTER_FETCH ? (
          <Alert
            tone="warning"
            className="mt-4 text-xs"
            title="Filtered view may be incomplete"
          >
            This source filter is based on the latest fetched items. Some older
            items may not be available from RSS or within the current fetch limit.
          </Alert>
        ) : null}

        {feedErrors.length > 0 && (
          <Alert
            tone="warning"
            className="mt-4 text-xs"
            title={`Failed feeds (${feedErrors.length}) for this feed.`}
          >
            <ul className="mt-2 space-y-1">
              {feedErrors.map((error) => (
                <li key={error.feedId}>
                  <span className="font-semibold">{error.feedTitle}</span>
                  {" · "}
                  <Link href={buildFeedHref(page.id)} className="underline">
                    {page.name}
                  </Link>
                  {" · "}
                  {error.message}
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </section>

      <section>
        <NewsFeedList
          articles={blend}
          pageContext={{ id: page.id, name: page.name }}
          savedArticleLinks={Array.from(savedArticleLinks)}
          fetchedAt={stream.fetchedAt}
          trackingKey={`page:${page.id}${
            selectedSource ? `:source:${selectedSource}` : ""
          }`}
        />

        {blend.length > 0 && (
          <div className="mt-8 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Link
                className={`underline ${
                  currentPage <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
                href={buildFeedHref(page.id, {
                  source: selectedSource || undefined,
                })}
              >
                First
              </Link>

              <Link
                className={`underline ${
                  currentPage <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
                href={buildFeedHref(page.id, {
                  source: selectedSource || undefined,
                  page: Math.max(1, currentPage - 1),
                })}
              >
                Prev
              </Link>
            </div>

            <span className="text-xs text-stone-600 dark:text-stone-400">
              Page {currentPage} ·{" "}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {blend.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {totalAvailableLabel}
              </span>{" "}
              {selectedSource ? "from this source" : "articles"} · Page size{" "}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {limit}
              </span>
              {selectedSource ? " · Filtered" : ""}
            </span>

            <Link
              className={`underline ${
                !hasMore ? "pointer-events-none opacity-40" : ""
              }`}
              href={buildFeedHref(page.id, {
                source: selectedSource || undefined,
                page: currentPage + 1,
              })}
            >
              Next
            </Link>
          </div>
        )}

        {blend.length === 0 && (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            No RSS items were returned for this feed.
          </p>
        )}
      </section>
    </>
  );
}