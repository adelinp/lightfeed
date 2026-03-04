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

// Cookie-based global limit
const COOKIE_NAME = "lightfeed_items_per_feed";
const DEFAULT_LIMIT = 28;
const MIN_LIMIT = 5;
const MAX_LIMIT = 200;

function clampInt(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(v)));
}

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const activePage = getHomepagePage();

  // Next passes searchParams as an object (can be undefined)
  const pageNumber = clampInt(sp.page ?? 1, 1);

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
  const limit = clampInt(limitFromCookie, DEFAULT_LIMIT);

  const currentPage = clampInt(pageNumber, 1);
  const offset = (currentPage - 1) * limit;

  const stream = activePage
    ? await getPageFeedStream(activePage.id, { limit: offset + limit + 1 })
    : { items: [], feedErrors: [], fetchedAt: null };

  const allItems = stream.items;
  const feedErrors = stream.feedErrors;

  const hasMore = allItems.length > offset + limit;
  const feedItems = allItems.slice(offset, offset + limit);

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
              href={`/feeds/${activePage.id}/edit`}
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

      {/* Pagination */}
      {activePage && allItems.length > 0 ? (
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
            Page {currentPage} · Showing {feedItems.length} items · Limit {limit}
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