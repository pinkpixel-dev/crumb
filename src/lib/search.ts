/**
 * Bookmark filtering.
 *
 * A normalised substring match over title, URL and domain. For a personal
 * collection this stays instant and, unlike fuzzy matching, never surprises
 * you with a result that has nothing to do with what you typed.
 */
import { baseDomain, hostname } from "./domains";
import type { Bookmark } from "../types/bookmark";

/** Lowercase and strip accents so "cafe" matches "café". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function haystack(bookmark: Bookmark): string {
  return normalize(
    [bookmark.title, bookmark.url, hostname(bookmark.url), baseDomain(bookmark.url)].join(" "),
  );
}

/**
 * Filter and rank bookmarks against a query.
 *
 * Ranking is deliberately shallow: a title match beats a match anywhere else,
 * and an earlier match beats a later one. Ties keep the incoming order.
 */
export function searchBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
  const needle = normalize(query.trim());
  if (!needle) return bookmarks;

  const scored: Array<{ bookmark: Bookmark; score: number; index: number }> = [];

  bookmarks.forEach((bookmark, index) => {
    const position = haystack(bookmark).indexOf(needle);
    if (position === -1) return;

    const titlePosition = normalize(bookmark.title).indexOf(needle);
    const score = titlePosition === -1 ? 1000 + position : titlePosition;
    scored.push({ bookmark, score, index });
  });

  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return scored.map((entry) => entry.bookmark);
}
