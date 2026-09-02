import { LayoutGrid, List } from "lucide-react";

import type { ViewMode } from "../types/settings";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const OPTIONS: Array<{ mode: ViewMode; label: string; Icon: typeof List }> = [
  { mode: "list", label: "List view", Icon: List },
  { mode: "cards", label: "Card view", Icon: LayoutGrid },
];

/**
 * Switches the bookmark list between rows and small cards. Favourites keep
 * their grid either way, since that layout already suits them.
 */
export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Bookmark layout"
      className="flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface p-0.5"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`grid size-6 place-items-center rounded transition-colors ${
              active
                ? "bg-accent-soft text-ink"
                : "text-faint hover:bg-hover hover:text-dim active:bg-active"
            }`}
          >
            <Icon size={13} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
