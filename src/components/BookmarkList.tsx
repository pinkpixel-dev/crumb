import { BookmarkCard } from "./BookmarkCard";
import { BookmarkRow } from "./BookmarkRow";
import type { Bookmark } from "../types/bookmark";
import type { ViewMode } from "../types/settings";

export const CARD_COLUMNS = 4;

type Props = {
  items: Bookmark[];
  viewMode: ViewMode;
  /** Where this list starts in the flattened keyboard index. */
  offset: number;
  selected: number;
  onOpen: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (bookmark: Bookmark, x: number, y: number) => void;
  onHover: (index: number) => void;
};

/** The main bookmark list, rendered either as rows or as small cards. */
export function BookmarkList({
  items,
  viewMode,
  offset,
  selected,
  onOpen,
  onToggleFavorite,
  onContextMenu,
  onHover,
}: Props) {
  const Item = viewMode === "cards" ? BookmarkCard : BookmarkRow;

  const wrapper =
    viewMode === "cards"
      ? "grid gap-1 px-2"
      : "flex flex-col gap-px px-2";

  return (
    <div
      className={wrapper}
      style={
        viewMode === "cards"
          ? { gridTemplateColumns: `repeat(${CARD_COLUMNS}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {items.map((bookmark, index) => (
        <Item
          key={bookmark.id}
          bookmark={bookmark}
          selected={selected === offset + index}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          onContextMenu={onContextMenu}
          onHover={() => onHover(offset + index)}
        />
      ))}
    </div>
  );
}
