/**
 * Thin wrappers over the Rust commands.
 *
 * The frontend owns the working copy of the collection and hands the whole
 * array back after every change; Rust writes it atomically. For a list this
 * small a full rewrite is cheaper than tracking deltas, and it means the file
 * on disk is never partially updated.
 */
import { invoke } from "@tauri-apps/api/core";

import type { Bookmark } from "../types/bookmark";
import { DEFAULT_SETTINGS, type Settings } from "../types/settings";

export async function loadBookmarks(): Promise<Bookmark[]> {
  return invoke<Bookmark[]>("load_bookmarks");
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await invoke("save_bookmarks", { bookmarks });
}

export async function loadSettings(): Promise<Settings> {
  const stored = await invoke<Partial<Settings>>("load_settings");
  // Merge over the defaults so a settings file written by an older version is
  // still usable after new options are added.
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await invoke("save_settings", { settings });
}

export async function bookmarksPath(): Promise<string> {
  return invoke<string>("bookmarks_path");
}

export async function clipboardText(): Promise<string> {
  return invoke<string>("clipboard_text");
}

/**
 * Open a bookmark in the default browser.
 *
 * Rust handles this rather than the opener plugin so that a browser which
 * fails to start is reported back here instead of passing as a success.
 */
export async function openLink(url: string): Promise<void> {
  await invoke("open_link", { url });
}

export async function hidePopup(): Promise<void> {
  await invoke("hide_popup");
}

export async function resizePopup(height: number): Promise<void> {
  await invoke("resize_popup", { height });
}

export async function setGlobalShortcut(accelerator: string): Promise<void> {
  await invoke("set_global_shortcut", { accelerator });
}

export async function setLaunchAtStartup(enabled: boolean): Promise<void> {
  await invoke("set_launch_at_startup", { enabled });
}
