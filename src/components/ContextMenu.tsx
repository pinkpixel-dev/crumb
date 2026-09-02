import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Pencil, Star, Trash2 } from "lucide-react";

import type { Bookmark } from "../types/bookmark";

export type MenuTarget = { bookmark: Bookmark; x: number; y: number };

type Props = {
  target: MenuTarget;
  onClose: () => void;
  onOpen: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onCopy: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
};

const MENU_WIDTH = 168;
const EDGE_GAP = 6;

/** Right-click actions for a single bookmark. Delete is kept apart on purpose. */
export function ContextMenu({
  target,
  onClose,
  onOpen,
  onToggleFavorite,
  onEdit,
  onCopy,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(ref.current?.offsetHeight ?? 0);
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  // Flip the menu back inside the popup when it would run off an edge.
  const left = Math.min(target.x, window.innerWidth - MENU_WIDTH - EDGE_GAP);
  const top = Math.min(target.y, Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP));

  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Actions for ${target.bookmark.title}`}
      style={{ left, top, width: MENU_WIDTH }}
      className="fixed z-50 rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-popup)]"
    >
      <MenuItem icon={ExternalLink} label="Open" onClick={run(() => onOpen(target.bookmark))} />
      <MenuItem
        icon={Star}
        label={target.bookmark.favorite ? "Remove from favorites" : "Add to favorites"}
        onClick={run(() => onToggleFavorite(target.bookmark.id))}
      />
      <MenuItem icon={Pencil} label="Edit" onClick={run(() => onEdit(target.bookmark))} />
      <MenuItem icon={Copy} label="Copy URL" onClick={run(() => onCopy(target.bookmark))} />

      <div className="my-1 h-px bg-line" role="separator" />

      <MenuItem
        icon={Trash2}
        label="Delete"
        danger
        onClick={run(() => onDelete(target.bookmark))}
      />
    </div>
  );
}

type MenuItemProps = {
  icon: typeof Copy;
  label: string;
  danger?: boolean;
  onClick: () => void;
};

function MenuItem({ icon: Icon, label, danger = false, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
        danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-hover"
      }`}
    >
      <Icon size={13} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
