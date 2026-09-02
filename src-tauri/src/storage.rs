//! Local persistence for bookmarks and settings.
//!
//! Everything lives in the platform app-data directory as plain JSON. Writes go
//! to a temporary file first and are then renamed over the real file, so a crash
//! or a quit mid-save can never leave a half-written bookmark collection behind.

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const BOOKMARKS_FILE: &str = "bookmarks.json";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bookmark {
    pub id: String,
    pub title: String,
    pub url: String,
    pub favorite: bool,
    pub created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_order: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    /// "system" | "light" | "dark"
    pub theme: String,
    /// "list" | "cards"
    pub view_mode: String,
    /// Accelerator string, e.g. "CmdOrCtrl+Alt+B". Empty disables the shortcut.
    pub global_shortcut: String,
    pub launch_at_startup: bool,
    pub confirm_delete: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".into(),
            view_mode: "list".into(),
            global_shortcut: "CmdOrCtrl+Alt+B".into(),
            launch_at_startup: false,
            confirm_delete: true,
        }
    }
}

/// Resolve the app-data directory, creating it if this is the first launch.
fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("could not create {}: {e}", dir.display()))?;
    Ok(dir)
}

/// Write `contents` to `name` atomically: temp file first, then rename into place.
fn write_atomic(app: &AppHandle, name: &str, contents: &str) -> Result<(), String> {
    let dir = data_dir(app)?;
    let target = dir.join(name);
    let temp = dir.join(format!("{name}.tmp"));

    fs::write(&temp, contents).map_err(|e| format!("could not write {}: {e}", temp.display()))?;
    fs::rename(&temp, &target)
        .map_err(|e| format!("could not replace {}: {e}", target.display()))?;
    Ok(())
}

/// Read and parse a JSON file, falling back to `default` when it is missing.
///
/// A file that exists but cannot be parsed is renamed to `<name>.corrupt` rather
/// than deleted, so a damaged collection is still recoverable by hand.
fn read_json<T: for<'de> Deserialize<'de>>(
    app: &AppHandle,
    name: &str,
    default: T,
) -> Result<T, String> {
    let path = data_dir(app)?.join(name);
    if !path.exists() {
        return Ok(default);
    }

    let raw = fs::read_to_string(&path).map_err(|e| format!("could not read {}: {e}", path.display()))?;
    match serde_json::from_str::<T>(&raw) {
        Ok(parsed) => Ok(parsed),
        Err(err) => {
            let backup = path.with_extension("corrupt");
            let _ = fs::rename(&path, &backup);
            Err(format!(
                "{} was not valid JSON ({err}); it was moved to {}",
                path.display(),
                backup.display()
            ))
        }
    }
}

pub fn load_bookmarks(app: &AppHandle) -> Result<Vec<Bookmark>, String> {
    read_json(app, BOOKMARKS_FILE, Vec::new())
}

pub fn save_bookmarks(app: &AppHandle, bookmarks: &[Bookmark]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(bookmarks).map_err(|e| e.to_string())?;
    write_atomic(app, BOOKMARKS_FILE, &json)
}

pub fn load_settings(app: &AppHandle) -> Result<Settings, String> {
    read_json(app, SETTINGS_FILE, Settings::default())
}

pub fn save_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    write_atomic(app, SETTINGS_FILE, &json)
}

/// Absolute path to the bookmark file, shown in Settings so the user knows
/// where their data actually lives.
pub fn bookmarks_path(app: &AppHandle) -> Result<String, String> {
    Ok(data_dir(app)?.join(BOOKMARKS_FILE).display().to_string())
}
