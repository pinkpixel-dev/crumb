//! Popup window behaviour: showing, hiding, placing near the tray, and
//! resizing to fit however many bookmarks are on screen.

use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, WebviewWindow};
use tauri_plugin_positioner::{Position, WindowExt};

pub const POPUP_LABEL: &str = "main";
pub const POPUP_WIDTH: f64 = 380.0;
pub const POPUP_MIN_HEIGHT: f64 = 220.0;
pub const POPUP_MAX_HEIGHT: f64 = 600.0;

/// Screen-edge gap so the popup never sits flush against the panel.
const EDGE_MARGIN: i32 = 8;

pub fn popup(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(POPUP_LABEL)
}

/// Place the popup next to the tray icon.
///
/// Linux tray implementations generally do not report their icon geometry, so
/// the positioner call fails there. In that case we fall back to the top-right
/// corner of whichever monitor currently holds the pointer, which is where the
/// tray lives on the large majority of desktops.
fn place_near_tray(window: &WebviewWindow) {
    if window.move_window(Position::TrayCenter).is_ok() {
        return;
    }
    if window.move_window(Position::TrayBottomCenter).is_ok() {
        return;
    }
    place_top_right_of_active_monitor(window);
}

fn place_top_right_of_active_monitor(window: &WebviewWindow) {
    let monitor = window
        .cursor_position()
        .ok()
        .and_then(|pos| window.monitor_from_point(pos.x, pos.y).ok().flatten())
        .or_else(|| window.current_monitor().ok().flatten());

    let Some(monitor) = monitor else { return };
    let Ok(size) = window.outer_size() else { return };

    let area = monitor.size();
    let origin = monitor.position();
    let x = origin.x + area.width as i32 - size.width as i32 - EDGE_MARGIN;
    let y = origin.y + EDGE_MARGIN;

    let _ = window.set_position(PhysicalPosition::new(x, y));
}

pub fn show_popup(app: &AppHandle) {
    let Some(window) = popup(app) else { return };
    place_near_tray(&window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit_to(POPUP_LABEL, "crumb://popup-shown", ());
}

pub fn hide_popup(app: &AppHandle) {
    if let Some(window) = popup(app) {
        let _ = window.hide();
    }
}

pub fn toggle_popup(app: &AppHandle) {
    let Some(window) = popup(app) else { return };
    match window.is_visible() {
        Ok(true) => hide_popup(app),
        _ => show_popup(app),
    }
}

/// Grow or shrink the popup to match its content, clamped to sane bounds.
pub fn resize_popup(app: &AppHandle, height: f64) {
    let Some(window) = popup(app) else { return };
    let clamped = height.clamp(POPUP_MIN_HEIGHT, POPUP_MAX_HEIGHT).round();
    let _ = window.set_size(LogicalSize::new(POPUP_WIDTH, clamped));
}
