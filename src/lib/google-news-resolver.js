import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { getSqliteDatabase } from "@/lib/sqlite";

const execFileAsync = promisify(execFile);
const CACHE_TTL_DAYS = 7;
let lastCleanupAt = 0;

function getHostname(rawValue) {
  try {
    return new URL(String(rawValue ?? "").trim()).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isGoogleNewsUrl(rawValue) {
  return getHostname(rawValue) === "news.google.com";
}

function isGoogleLikeUrl(rawValue) {
  const hostname = getHostname(rawValue);
  return (
    hostname === "google.com" ||
    hostname.endsWith(".google.com") ||
    hostname === "news.google.com" ||
    hostname === "consent.google.com"
  );
}

function ensureResolvedUrlCacheTable() {
  const db = getSqliteDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS resolved_article_urls (
      source_url TEXT PRIMARY KEY,
      resolved_url TEXT NOT NULL,
      resolved_at TEXT NOT NULL
    )
  `);
}

function cleanupExpiredResolvedUrls() {
  const db = getSqliteDatabase();

  db.exec(`
    DELETE FROM resolved_article_urls
    WHERE resolved_at < datetime('now', '-${CACHE_TTL_DAYS} days')
  `);
}

function maybeCleanupExpiredResolvedUrls() {
  const now = Date.now();

  if (now - lastCleanupAt > 24 * 60 * 60 * 1000) {
    cleanupExpiredResolvedUrls();
    lastCleanupAt = now;
  }
}

function getCachedResolvedUrl(sourceUrl) {
  const db = getSqliteDatabase();

  const row = db.prepare(`
    SELECT resolved_url
    FROM resolved_article_urls
    WHERE source_url = ?
      AND resolved_at >= datetime('now', '-${CACHE_TTL_DAYS} days')
  `).get(sourceUrl);

  if (!row?.resolved_url) {
    return null;
  }

  if (isGoogleLikeUrl(row.resolved_url)) {
    return null;
  }

  return row.resolved_url;
}

function saveResolvedUrl(sourceUrl, resolvedUrl) {
  if (!resolvedUrl || isGoogleLikeUrl(resolvedUrl)) {
    return;
  }

  const db = getSqliteDatabase();

  db.prepare(`
    INSERT INTO resolved_article_urls (source_url, resolved_url, resolved_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(source_url) DO UPDATE SET
      resolved_url = excluded.resolved_url,
      resolved_at = excluded.resolved_at
  `).run(sourceUrl, resolvedUrl);
}

export async function resolveGoogleNewsUrl(sourceUrl) {
  const url = String(sourceUrl ?? "").trim();

  if (!url) {
    return null;
  }

  if (!isGoogleNewsUrl(url)) {
    return isGoogleLikeUrl(url) ? null : url;
  }

  ensureResolvedUrlCacheTable();
  maybeCleanupExpiredResolvedUrls();

  const cached = getCachedResolvedUrl(url);
  if (cached) {
    console.log("[google-news-resolver] cache hit:", cached);
    return cached;
  }

  const pythonCmd = process.platform === "win32" ? "py" : "python3";
  const scriptPath = path.resolve(process.cwd(), "src", "tools", "google_news_decode.py");

  console.log("[google-news-resolver] cwd:", process.cwd());
  console.log("[google-news-resolver] pythonCmd:", pythonCmd);
  console.log("[google-news-resolver] scriptPath:", scriptPath);
  console.log("[google-news-resolver] sourceUrl:", url);

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonCmd,
      [scriptPath, url],
      {
        timeout: 20000,
        windowsHide: true,
      },
    );

    if (stderr?.trim()) {
      console.log("[google-news-resolver] stderr:", stderr);
    }

    console.log("[google-news-resolver] stdout:", stdout);

    const payload = JSON.parse(String(stdout ?? "").trim() || "{}");
    const resolvedUrl = String(payload?.decoded_url ?? "").trim();

    if (payload?.status && resolvedUrl && !isGoogleLikeUrl(resolvedUrl)) {
    saveResolvedUrl(url, resolvedUrl);
    return resolvedUrl;
    }

    console.warn("[google-news-resolver] decoder returned no usable URL:", payload);
    return null;
  } catch (error) {
    console.error("[google-news-resolver] failure:", error);
    throw error;
  }
}