import { useEffect, useRef } from "react";

export type DialogAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "quiet";
};

type Props = {
  title: string;
  message: string;
  actions: DialogAction[];
  onDismiss: () => void;
};

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:opacity-90 active:opacity-80",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80",
  quiet: "text-dim hover:bg-hover hover:text-ink",
} as const;

/**
 * A small confirmation sheet over the popup, used for duplicate links and for
 * delete confirmation. Focus moves to the first action and Escape dismisses.
 */
export function Dialog({ title, message, actions, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-bg/80 p-4">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow-popup)]"
      >
        <h2 className="font-display text-[14px] text-ink">{title}</h2>
        <p className="mt-1 text-[11.5px] leading-snug text-dim">{message}</p>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`h-7 rounded-md px-2.5 font-medium transition-opacity transition-colors ${
                VARIANTS[action.variant ?? "quiet"]
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
