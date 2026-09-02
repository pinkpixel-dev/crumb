import { Star } from "lucide-react";

import { SiteIcon } from "./SiteIcon";
import { keepVisible, type ItemProps } from "./BookmarkRow";

/**
 * A small tile: icon above a two-line title, sized to fit exactly that. The
 * domain is left off because at this size it would only ever be truncated, and
 * it is still on the row layout and in the tooltip.
 */
export function BookmarkCard({
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
      className={`group relative rounded-lg border transition-colors ${
        selected ? "border-line-strong bg-hover" : "border-line bg-surface hover:bg-hover"
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
        title={`${bookmark.title}\n${bookmark.url}`}
        className="flex w-full flex-col items-center gap-1 px-1 py-2"
      >
        <SiteIcon url={bookmark.url} size={20} />
        <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-dim">
          {bookmark.title}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(bookmark.id)}
        aria-pressed={bookmark.favorite}
        aria-label={bookmark.favorite ? "Remove from favorites" : "Add to favorites"}
        title={bookmark.favorite ? "Remove from favorites" : "Add to favorites"}
        className={`absolute top-0.5 right-0.5 grid size-4 place-items-center rounded
                    bg-surface/85 transition-colors hover:bg-active focus-visible:opacity-100 ${
                      bookmark.favorite
                        ? "text-accent opacity-100"
                        : "text-faint opacity-0 group-hover:opacity-100"
                    }`}
      >
        <Star size={9} aria-hidden="true" fill={bookmark.favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
