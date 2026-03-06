/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Suspense } from "react";
import { Settings } from "lucide";
import { cookies } from "next/headers";
import { Alert } from "@/components/alert";
import { AppShell } from "@/components/app-shell";
import LucideIcon from "@/components/lucide-icon";
import { FeedGhostList } from "@/components/feed-ghost-list";
import { NewsFeedList } from "@/components/news-feed-list";
import { getHomepagePage } from "@/lib/lightfeed-data";
import { getPageFeedStream } from "@/lib/rss-stream";
import { listSavedArticleLinksByLinks } from "@/lib/saved-articles-db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Home",
  description: "Your latest headlines from configured RSS feeds.",
};

const COOKIE_NAME = "lightfeed_items_per_feed";
const DEFAULT_LIMIT = 28;
const MIN_LIMIT = 5;
const MAX_LIMIT = 200;
const HOME_TOTAL_FETCH_LIMIT = 1000;

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

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const activePage = getHomepagePage();
  const pageNumber = clampPage(sp.page ?? 1, 1);

  return (
    <AppShell>
      <Suspense
        fallback={
          <FeedGhostList
            count={6}
            titleWidthClass={activePage ? "w-72" : "w-56"}
          />
        }
      >
        <HomeFeedSection activePage={activePage} pageNumber={pageNumber} />
      </Suspense>
    </AppShell>
  );
}

async function HomeFeedSection({ activePage, pageNumber }) {
  const cookieStore = await cookies();
  const limitFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const limit = clampLimit(limitFromCookie, DEFAULT_LIMIT);

  const currentPage = clampPage(pageNumber, 1);
  const offset = (currentPage - 1) * limit;

  const stream = activePage
    ? await getPageFeedStream(activePage.id, { limit: HOME_TOTAL_FETCH_LIMIT })
    : { items: [], feedErrors: [], fetchedAt: null };

  const allItems = stream.items ?? [];
  const feedErrors = stream.feedErrors ?? [];

  const totalArticles = allItems.length;
  const hasMore = offset + limit < totalArticles;
  const feedItems = allItems.slice(offset, offset + limit);

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

  const totalSources = sources.length;

  const savedArticleLinks = listSavedArticleLinksByLinks(
    feedItems.map((article) => article.link),
  );

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="">
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
            {activePage?.name ?? "No Feed Selected"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activePage ? (
            <Link
              className="flex items-center gap-2 font-bold text-xs hover:text-stone-700 dark:text-stone-300 dark:hover:text-stone-100"
              href={`/settings/feeds/${activePage.id}/edit`}
              aria-label={`${activePage.name} settings`}
              title="Feed settings"
            >
              <LucideIcon icon={Settings} />
              Settings
            </Link>
          ) : (
            <Link
              className="flex items-center gap-2 font-bold text-xs hover:underline"
              href="/feeds"
            >
              Manage Feeds
            </Link>
          )}
        </div>
      </div>

      {activePage && sources.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sources.map((source) => (
            <div
              key={source.id}
              title={`${source.title} #${source.ordinal}`}
              aria-label={`${source.title} ${source.ordinal}`}
              className="relative block h-8 w-8 overflow-visible"
            >
              <div className="h-8 w-8 overflow-hidden rounded-md">
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
            </div>
          ))}
        </div>
      ) : null}

      {activePage && totalArticles > 0 ? (
        <div className="mt-3 text-xs text-stone-600 dark:text-stone-400">
          Showing {feedItems.length} of {totalArticles} articles · {totalSources}{" "}
          {totalSources === 1 ? "source" : "sources"}
        </div>
      ) : null}

      {feedErrors.length > 0 ? (
        <Alert
          tone="warning"
          className="mt-4 text-xs"
          title={`Failed feeds (${feedErrors.length}) - available feeds are still shown.`}
        >
          <ul className="mt-2 space-y-1">
            {feedErrors.map((error) => (
              <li key={error.feedId}>
                <span className="font-semibold">{error.feedTitle}</span>
                {" · "}
                {activePage ? (
                  <Link href={`/feeds/${activePage.id}`} className="underline">
                    {activePage.name}
                  </Link>
                ) : (
                  <span>Unknown feed</span>
                )}
                {" · "}
                {error.message}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <NewsFeedList
        articles={feedItems}
        pageContext={
          activePage ? { id: activePage.id, name: activePage.name } : null
        }
        savedArticleLinks={Array.from(savedArticleLinks)}
        fetchedAt={stream.fetchedAt}
        trackingKey={activePage ? `page:${activePage.id}` : "home:none"}
        className="mt-4 space-y-8"
      />

      {activePage && totalArticles > 0 ? (
        <div className="mt-6 flex items-center justify-between">
          <Link
            className={`text-sm underline ${
              currentPage <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
            href={`/?page=${Math.max(1, currentPage - 1)}`}
          >
            Prev
          </Link>

          <span className="text-xs text-stone-600 dark:text-stone-400">
            Page {currentPage} · Showing {feedItems.length} of {totalArticles}{" "}
            articles · {totalSources} {totalSources === 1 ? "source" : "sources"}
          </span>

          <Link
            className={`text-sm underline ${
              !hasMore ? "pointer-events-none opacity-40" : ""
            }`}
            href={`/?page=${currentPage + 1}`}
          >
            Next
          </Link>
        </div>
      ) : null}

      {feedItems.length === 0 ? (
        <p className="mt-5 text-sm text-stone-700 dark:text-stone-300">
          No articles available for this feed right now.
        </p>
      ) : null}
    </section>
  );
}