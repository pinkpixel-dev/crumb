import { BookmarkList } from "./BookmarkList";
import { SectionLabel } from "./SectionLabel";
import type { Bookmark } from "../types/bookmark";
import type { ViewMode } from "../types/settings";

type Props = {
  items: Bookmark[];
  /** Total number of stored bookmarks, used to tell "empty" from "no match". */
  total: number;
  searching: boolean;
  viewMode: ViewMode;
  /** Where this list starts in the flattened keyboard index. */
  offset: number;
  selected: number;
  onOpen: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (bookmark: Bookmark, x: number, y: number) => void;
  onHover: (index: number) => void;
};

/** The scrolling part of the popup: everything that is not a favourite. */
export function LinksSection({
  items,
  total,
  searching,
  viewMode,
  offset,
  selected,
  onOpen,
  onToggleFavorite,
  onContextMenu,
  onHover,
}: Props) {
  if (items.length === 0) {
    return <EmptyState searching={searching} hasBookmarks={total > 0} showAtAll={offset === 0} />;
  }

  return (
    <section aria-label={searching ? "Search results" : "All bookmarks"} className="py-2">
      <SectionLabel count={items.length}>{searching ? "Results" : "All links"}</SectionLabel>
      <BookmarkList
        items={items}
        viewMode={viewMode}
        offset={offset}
        selected={selected}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        onContextMenu={onContextMenu}
        onHover={onHover}
      />
    </section>
  );
}

function EmptyState({
  searching,
  hasBookmarks,
  showAtAll,
}: {
  searching: boolean;
  hasBookmarks: boolean;
  showAtAll: boolean;
}) {
  // Everything the user has is already pinned above, so there is nothing to say.
  if (!showAtAll && !searching) return null;

  if (searching) {
    return (
      <p className="px-4 py-8 text-center text-[11.5px] text-faint">
        {hasBookmarks ? "Nothing matches that." : "No bookmarks yet."}
      </p>
    );
  }

  return (
    <div className="px-6 py-8 text-center">
      <p className="font-display text-[15px] text-ink">Nothing saved yet</p>
      <p className="mt-1 text-[11.5px] leading-snug text-dim">
        Add a link and it shows up here. Pin the ones you open most and they move to the top.
      </p>
    </div>
  );
}
