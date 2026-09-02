//! Commands the popup calls over IPC.
//!
//! The frontend holds the working copy of the bookmark list and hands the whole
//! collection back whenever it changes. That keeps the Rust side to persistence
//! and window control, which is all it really needs to do.

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::opener;
use crate::shortcuts;
use crate::storage::{self, Bookmark, Settings};
use crate::window;

#[tauri::command]
pub fn load_bookmarks(app: AppHandle) -> Result<Vec<Bookmark>, String> {
    storage::load_bookmarks(&app)
}

#[tauri::command]
pub fn save_bookmarks(app: AppHandle, bookmarks: Vec<Bookmark>) -> Result<(), String> {
    storage::save_bookmarks(&app, &bookmarks)
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<Settings, String> {
    storage::load_settings(&app)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    storage::save_settings(&app, &settings)
}

#[tauri::command]
pub fn bookmarks_path(app: AppHandle) -> Result<String, String> {
    storage::bookmarks_path(&app)
}

/// Raw clipboard text. The frontend decides whether it looks like a URL, so
/// that validation lives in exactly one place.
#[tauri::command]
pub fn clipboard_text(app: AppHandle) -> Result<String, String> {
    app.clipboard().read_text().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn hide_popup(app: AppHandle) {
    window::hide_popup(&app);
}

#[tauri::command]
pub fn resize_popup(app: AppHandle, height: f64) {
    window::resize_popup(&app, height);
}

#[tauri::command]
pub fn set_global_shortcut(app: AppHandle, accelerator: String) -> Result<(), String> {
    shortcuts::apply(&app, &accelerator)
}

#[tauri::command]
pub fn set_launch_at_startup(app: AppHandle, enabled: bool) -> Result<(), String> {
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|e| e.to_string())
    } else {
        manager.disable().map_err(|e| e.to_string())
    }
}

/// Open a bookmark in the user's default browser.
///
/// The work happens on a blocking thread because it waits briefly on the
/// launcher it starts, and the popup must stay responsive while it does.
#[tauri::command]
pub async fn open_link(url: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || opener::open_url(&url))
        .await
        .map_err(|err| format!("Opening the link was interrupted: {err}"))?
}
