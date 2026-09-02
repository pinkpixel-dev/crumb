import { useCallback, useEffect, useState } from "react";

/** One run of items in the popup, and how many of them sit on a row. */
export type NavSection = {
  count: number;
  /** 1 for a vertical list, or the number of columns for a grid. */
  columns: number;
};

type UseNavigation = {
  /** Index into the flattened item list, or -1 when nothing is selected. */
  index: number;
  setIndex: (next: number) => void;
  /** Handles arrow keys. Returns true when the key was consumed. */
  handleKey: (key: string) => boolean;
};

/**
 * Arrow-key movement across the favourites grid and the bookmark list.
 *
 * Sections are flattened into one index so Enter and Escape stay simple, but
 * each section keeps its own column count. That way Down moves a whole row
 * inside the favourites grid and a single item inside the list, which is what
 * both layouts look like they should do.
 */
export function useNavigation(sections: NavSection[]): UseNavigation {
  const total = sections.reduce((sum, section) => sum + section.count, 0);
  const [index, setIndexRaw] = useState(-1);

  // Keep the selection inside the list as it filters and changes length.
  useEffect(() => {
    setIndexRaw((current) => (current >= total ? total - 1 : current));
  }, [total]);

  const setIndex = useCallback(
    (next: number) => setIndexRaw(Math.max(-1, Math.min(next, total - 1))),
    [total],
  );

  const handleKey = useCallback(
    (key: string) => {
      if (total === 0) return false;

      const step = verticalStep(sections, index, key);
      if (step !== null) {
        setIndexRaw(wrap(index + step, total));
        return true;
      }

      if (key === "ArrowRight" || key === "ArrowLeft") {
        // Sideways movement only means something inside a grid.
        if (columnsAt(sections, Math.max(index, 0)) === 1) return false;
        setIndexRaw(wrap(index + (key === "ArrowRight" ? 1 : -1), total));
        return true;
      }

      return false;
    },
    [index, sections, total],
  );

  return { index, setIndex, handleKey };
}

/** How far Up or Down should jump from the current position, or null. */
function verticalStep(sections: NavSection[], index: number, key: string): number | null {
  if (key !== "ArrowDown" && key !== "ArrowUp") return null;

  // Nothing selected yet: Down starts at the top, Up starts at the bottom.
  if (index < 0) return key === "ArrowDown" ? 1 : 0;

  const columns = columnsAt(sections, index);
  return key === "ArrowDown" ? columns : -columns;
}

function columnsAt(sections: NavSection[], index: number): number {
  let offset = 0;
  for (const section of sections) {
    if (index < offset + section.count) return section.columns;
    offset += section.count;
  }
  return 1;
}

/** Wrap around the ends so holding an arrow key never dead-ends. */
function wrap(next: number, total: number): number {
  if (total === 0) return -1;
  return ((next % total) + total) % total;
}
