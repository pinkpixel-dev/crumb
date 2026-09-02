import { FavoriteGrid } from "./FavoriteGrid";
import { SectionLabel } from "./SectionLabel";
import type { Bookmark } from "../types/bookmark";

type Props = {
  items: Bookmark[];
  selected: number;
  onOpen: (bookmark: Bookmark) => void;
  onContextMenu: (bookmark: Bookmark, x: number, y: number) => void;
  onReorder: (id: string, toIndex: number) => void;
  onHover: (index: number) => void;
};

/**
 * The favourites grid, pinned above the action bar rather than scrolling with
 * the main list. A large grid gets its own scroll so it cannot push the list
 * out of the popup.
 */
export function FavoritesSection({
  items,
  selected,
  onOpen,
  onContextMenu,
  onReorder,
  onHover,
}: Props) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Favorites" className="shrink-0 pt-2">
      <SectionLabel>Favorites</SectionLabel>
      <div className="scroll-thin max-h-[190px] overflow-y-auto pb-2">
        <FavoriteGrid
          items={items}
          selected={selected}
          onOpen={onOpen}
          onContextMenu={onContextMenu}
          onReorder={onReorder}
          onHover={onHover}
        />
      </div>
    </section>
  );
}
