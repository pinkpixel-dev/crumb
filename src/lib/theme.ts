/**
 * Theme application.
 *
 * The document always carries an explicit `data-theme` of light or dark, even
 * when the setting is "system". Resolving the system preference in one place
 * keeps every stylesheet rule free of media queries.
 */
import type { Theme } from "../types/settings";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = resolveTheme(theme);
}

/**
 * Keep the document in sync while the setting is "system".
 * Returns an unsubscribe function.
 */
export function watchSystemTheme(theme: Theme, onChange: () => void): () => void {
  if (theme !== "system") return () => {};

  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
