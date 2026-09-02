import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

export type TrayHandlers = {
  onAddLink: () => void;
  onAddClipboard: () => void;
  onOpenSettings: () => void;
  onShown: () => void;
};

const EVENTS = {
  "crumb://add-link": "onAddLink",
  "crumb://add-clipboard": "onAddClipboard",
  "crumb://open-settings": "onOpenSettings",
  "crumb://popup-shown": "onShown",
} as const;

/**
 * Bridges the tray menu and the global hotkey to the views in the popup.
 *
 * Handlers are read from a ref-like object on every event, so the listeners are
 * registered once and never need re-subscribing when a callback identity
 * changes.
 */
export function useTrayEvents(handlers: TrayHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const unlisteners = Object.entries(EVENTS).map(([event, key]) =>
      listen(event, () => ref.current[key]()),
    );

    return () => {
      unlisteners.forEach((pending) => {
        pending.then((off) => off()).catch(() => {});
      });
    };
    // Registered once for the lifetime of the popup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
