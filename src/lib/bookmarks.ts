/**
 * Pure operations on a bookmark collection.
 *
 * Nothing here touches disk or React state; each function takes a list and
 * returns a new one, which keeps the reducer in useBookmarks trivial to follow.
 */
import type { Bookmark, BookmarkDraft } from "../types/bookmark";
import { knownSite } from "./icons";
import { hostname } from "./domains";
import { normalizeUrl, sameLink, suggestTitleFromUrl } from "./urls";

/** Build a bookmark from form input. Returns null if the URL is unusable. */
export function createBookmark(draft: BookmarkDraft): Bookmark | null {
  const url = normalizeUrl(draft.url);
  if (!url) return null;

  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: draft.title.trim() || suggestedTitle(url),
    url,
    favorite: draft.favorite,
    createdAt: now,
  };
}

/**
 * The title Crumb offers for a URL: the registry name for a recognised site,
 * otherwise a readable guess from the path, otherwise the hostname.
 */
export function suggestedTitle(url: string): string {
  const site = knownSite(url);
  if (site) return site.name;

  return suggestTitleFromUrl(url) || hostname(url) || url;
}

export function applyEdit(
  bookmarks: Bookmark[],
  id: string,
  draft: BookmarkDraft,
): Bookmark[] {
  const url = normalizeUrl(draft.url);
  if (!url) return bookmarks;

  return bookmarks.map((bookmark) =>
    bookmark.id === id
      ? {
          ...bookmark,
          url,
          title: draft.title.trim() || suggestedTitle(url),
          favorite: draft.favorite,
          updatedAt: Date.now(),
        }
      : bookmark,
  );
}

export function removeBookmark(bookmarks: Bookmark[], id: string): Bookmark[] {
  return bookmarks.filter((bookmark) => bookmark.id !== id);
}

export function toggleFavorite(bookmarks: Bookmark[], id: string): Bookmark[] {
  const nextOrder = highestSortOrder(bookmarks) + 1;

  return bookmarks.map((bookmark) =>
    bookmark.id === id
      ? {
          ...bookmark,
          favorite: !bookmark.favorite,
          // A newly favourited link goes to the end of the grid rather than
          // jumping into the middle of an order the user arranged.
          sortOrder: bookmark.favorite ? undefined : nextOrder,
          updatedAt: Date.now(),
        }
      : bookmark,
  );
}

/** Favourites in display order: explicit sortOrder first, then oldest first. */
export function favorites(bookmarks: Bookmark[]): Bookmark[] {
  return bookmarks
    .filter((bookmark) => bookmark.favorite)
    .sort(
      (a, b) =>
        (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.createdAt - b.createdAt,
    );
}

/** Everything that is not a favourite, newest first. */
export function others(bookmarks: Bookmark[]): Bookmark[] {
  return bookmarks
    .filter((bookmark) => !bookmark.favorite)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Move a favourite to a new index and rewrite sortOrder across the whole grid,
 * so positions stay dense and predictable after any number of moves.
 */
export function reorderFavorite(
  bookmarks: Bookmark[],
  id: string,
  toIndex: number,
): Bookmark[] {
  const ordered = favorites(bookmarks);
  const from = ordered.findIndex((bookmark) => bookmark.id === id);
  if (from === -1) return bookmarks;

  const target = Math.max(0, Math.min(toIndex, ordered.length - 1));
  if (target === from) return bookmarks;

  const [moved] = ordered.splice(from, 1);
  ordered.splice(target, 0, moved);

  const positions = new Map(ordered.map((bookmark, index) => [bookmark.id, index]));
  return bookmarks.map((bookmark) =>
    positions.has(bookmark.id)
      ? { ...bookmark, sortOrder: positions.get(bookmark.id) }
      : bookmark,
  );
}

/** An existing bookmark pointing at the same link, ignoring `exceptId`. */
export function findDuplicate(
  bookmarks: Bookmark[],
  url: string,
  exceptId?: string,
): Bookmark | null {
  return (
    bookmarks.find(
      (bookmark) => bookmark.id !== exceptId && sameLink(bookmark.url, url),
    ) ?? null
  );
}

function highestSortOrder(bookmarks: Bookmark[]): number {
  return bookmarks.reduce(
    (max, bookmark) => Math.max(max, bookmark.sortOrder ?? -1),
    -1,
  );
}
