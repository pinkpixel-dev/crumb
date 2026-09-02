//! Optional global hotkey that opens the popup from anywhere.
//!
//! The accelerator is a user setting, so registration has to be re-runnable at
//! any time: every change clears the old binding before installing the new one.

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::window;

/// Replace whatever hotkey is registered with `accelerator`.
///
/// An empty accelerator just clears the binding, which is how the user turns
/// the feature off from Settings.
pub fn apply(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    let manager = app.global_shortcut();
    let _ = manager.unregister_all();

    let trimmed = accelerator.trim();
    if trimmed.is_empty() {
        return Ok(());
    }

    let shortcut: Shortcut = trimmed
        .parse()
        .map_err(|_| format!("\"{trimmed}\" is not a valid shortcut"))?;

    manager
        .register(shortcut)
        .map_err(|e| format!("could not register \"{trimmed}\": {e}"))
}

/// Handler invoked whenever a registered hotkey fires.
pub fn on_shortcut(app: &AppHandle, _shortcut: &Shortcut, state: ShortcutState) {
    // Fire on press only, otherwise the release event immediately toggles back.
    if state == ShortcutState::Pressed {
        window::toggle_popup(app);
    }
}
