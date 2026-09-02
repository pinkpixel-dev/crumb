import { ClipboardPlus, Plus, Settings as SettingsIcon } from "lucide-react";

type Props = {
  onAdd: () => void;
  onAddClipboard: () => void;
  onOpenSettings: () => void;
};

/**
 * Add, clipboard and settings, sitting between the favourites grid and the
 * bookmark list. It stays put while the list scrolls, so it does not drift to
 * the bottom of a long collection.
 */
export function ActionBar({ onAdd, onAddClipboard, onOpenSettings }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-y border-line px-2 py-1.5">
      <button
        type="button"
        onClick={onAdd}
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-ink transition-colors hover:bg-hover"
      >
        <Plus size={13} aria-hidden="true" />
        Add link
      </button>
      <button
        type="button"
        onClick={onAddClipboard}
        aria-label="Add the URL on the clipboard"
        title="Add the URL on the clipboard"
        className="grid size-7 place-items-center rounded-md text-faint
                   transition-colors hover:bg-hover hover:text-ink"
      >
        <ClipboardPlus size={13} aria-hidden="true" />
      </button>

      <span className="ml-auto font-mono text-[10px] text-faint">↑↓ · ⏎ · esc</span>

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
        className="grid size-7 place-items-center rounded-md text-faint
                   transition-colors hover:bg-hover hover:text-ink"
      >
        <SettingsIcon size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
