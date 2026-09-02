import { useState } from "react";

import { SiteIcon } from "./SiteIcon";
import { keepVisible } from "./BookmarkRow";
import type { Bookmark } from "../types/bookmark";

export const FAVORITE_COLUMNS = 4;

type Props = {
  items: Bookmark[];
  /** Index of the selected favourite, or -1 when the selection is elsewhere. */
  selected: number;
  onOpen: (bookmark: Bookmark) => void;
  onContextMenu: (bookmark: Bookmark, x: number, y: number) => void;
  onReorder: (id: string, toIndex: number) => void;
  onHover: (index: number) => void;
};

/**
 * Favourites as a compact launcher grid.
 *
 * Tiles can be dragged to reorder. The same thing works from the keyboard with
 * Alt plus an arrow key, so reordering never depends on a pointer.
 */
export function FavoriteGrid({
  items,
  selected,
  onOpen,
  onContextMenu,
  onReorder,
  onHover,
}: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const finishDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <div
      className="grid gap-1 px-2"
      style={{ gridTemplateColumns: `repeat(${FAVORITE_COLUMNS}, minmax(0, 1fr))` }}
      onDragLeave={() => setDropTarget(null)}
    >
      {items.map((bookmark, index) => (
        <button
          key={bookmark.id}
          ref={selected === index ? keepVisible : undefined}
          type="button"
          draggable
          title={`${bookmark.title}\n${bookmark.url}`}
          onClick={() => onOpen(bookmark)}
          onMouseEnter={() => onHover(index)}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu(bookmark, event.clientX, event.clientY);
          }}
          onKeyDown={(event) => {
            if (!event.altKey) return;
            const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            const rowDelta =
              event.key === "ArrowDown"
                ? FAVORITE_COLUMNS
                : event.key === "ArrowUp"
                  ? -FAVORITE_COLUMNS
                  : 0;
            if (!delta && !rowDelta) return;
            event.preventDefault();
            event.stopPropagation();
            onReorder(bookmark.id, index + delta + rowDelta);
          }}
          onDragStart={(event) => {
            setDragging(bookmark.id);
            event.dataTransfer.effectAllowed = "move";
            // Firefox refuses to start a drag without payload on the transfer.
            event.dataTransfer.setData("text/plain", bookmark.id);
          }}
          onDragOver={(event) => {
            if (!dragging) return;
            event.preventDefault();
            setDropTarget(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging) onReorder(dragging, index);
            finishDrag();
          }}
          onDragEnd={finishDrag}
          className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors
                      ${
                        selected === index
                          ? "border-line-strong bg-hover"
                          : "border-transparent hover:bg-hover"
                      }
                      ${dragging === bookmark.id ? "opacity-40" : ""}
                      ${dropTarget === index && dragging !== bookmark.id ? "border-accent" : ""}`}
        >
          <SiteIcon url={bookmark.url} size={22} />
          <span className="w-full truncate text-center text-[10px] leading-tight text-dim">
            {bookmark.title}
          </span>
        </button>
      ))}
    </div>
  );
}
