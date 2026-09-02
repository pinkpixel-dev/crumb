import { Star } from "lucide-react";

import { SiteIcon } from "./SiteIcon";
import { displayUrl } from "../lib/urls";
import type { Bookmark } from "../types/bookmark";

export type ItemProps = {
  bookmark: Bookmark;
  selected: boolean;
  onOpen: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (bookmark: Bookmark, x: number, y: number) => void;
  onHover: () => void;
};

/** Scrolls the keyboard-selected item just far enough to be visible. */
export function keepVisible(element: HTMLElement | null) {
  element?.scrollIntoView({ block: "nearest" });
}

/** A compact row: icon, title, and the shortened link underneath. */
export function BookmarkRow({
  bookmark,
  selected,
  onOpen,
  onToggleFavorite,
  onContextMenu,
  onHover,
}: ItemProps) {
  return (
    <div
      ref={selected ? keepVisible : undefined}
      className={`group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
        selected ? "bg-hover" : "hover:bg-hover"
      }`}
      onMouseEnter={onHover}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(bookmark, event.clientX, event.clientY);
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(bookmark)}
        title={bookmark.url}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <SiteIcon url={bookmark.url} size={17} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-ink">{bookmark.title}</span>
          <span className="block truncate font-mono text-[10.5px] text-faint">
            {displayUrl(bookmark.url)}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(bookmark.id)}
        aria-pressed={bookmark.favorite}
        aria-label={bookmark.favorite ? "Remove from favorites" : "Add to favorites"}
        title={bookmark.favorite ? "Remove from favorites" : "Add to favorites"}
        className={`grid size-6 shrink-0 place-items-center rounded transition-colors
                    hover:bg-active focus-visible:opacity-100 ${
                      bookmark.favorite
                        ? "text-accent"
                        : "text-faint opacity-0 group-hover:opacity-100"
                    } ${selected ? "opacity-100" : ""}`}
      >
        <Star size={13} aria-hidden="true" fill={bookmark.favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
