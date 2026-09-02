import { useCallback, useEffect, useRef, useState } from "react";

import * as ops from "../lib/bookmarks";
import * as storage from "../lib/storage";
import type { Bookmark, BookmarkDraft } from "../types/bookmark";

type UseBookmarks = {
  bookmarks: Bookmark[];
  ready: boolean;
  error: string | null;
  add: (draft: BookmarkDraft) => Bookmark | null;
  edit: (id: string, draft: BookmarkDraft) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  reorderFavorite: (id: string, toIndex: number) => void;
  dismissError: () => void;
};

/**
 * Holds the bookmark collection and writes it back after every change.
 *
 * Saves are queued rather than fired in parallel so two quick edits cannot
 * race and write an older list over a newer one.
 */
export function useBookmarks(): UseBookmarks {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;

    storage
      .loadBookmarks()
      .then((loaded) => active && setBookmarks(loaded))
      .catch((err) => active && setError(String(err)))
      .finally(() => active && setReady(true));

    return () => {
      active = false;
    };
  }, []);

  /** Apply a pure list operation to the current state and save the result. */
  const mutate = useCallback(
    (transform: (current: Bookmark[]) => Bookmark[]) => {
      setBookmarks((current) => {
        const next = transform(current);
        queue.current = queue.current
          .then(() => storage.saveBookmarks(next))
          .then(() => setError(null))
          .catch((err) => setError(String(err)));
        return next;
      });
    },
    [],
  );

  const add = useCallback(
    (draft: BookmarkDraft) => {
      const bookmark = ops.createBookmark(draft);
      if (!bookmark) return null;
      mutate((current) => [bookmark, ...current]);
      return bookmark;
    },
    [mutate],
  );

  const edit = useCallback(
    (id: string, draft: BookmarkDraft) => mutate((current) => ops.applyEdit(current, id, draft)),
    [mutate],
  );

  const remove = useCallback(
    (id: string) => mutate((current) => ops.removeBookmark(current, id)),
    [mutate],
  );

  const toggleFavorite = useCallback(
    (id: string) => mutate((current) => ops.toggleFavorite(current, id)),
    [mutate],
  );

  const reorderFavorite = useCallback(
    (id: string, toIndex: number) =>
      mutate((current) => ops.reorderFavorite(current, id, toIndex)),
    [mutate],
  );

  const dismissError = useCallback(() => setError(null), []);

  return {
    bookmarks,
    ready,
    error,
    add,
    edit,
    remove,
    toggleFavorite,
    reorderFavorite,
    dismissError,
  };
}
