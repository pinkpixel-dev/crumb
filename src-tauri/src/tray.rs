//! System tray icon and its context menu.
//!
//! Left-clicking the icon toggles the popup. Linux tray implementations mostly
//! swallow left clicks and open the menu instead, which is why "Open Bookmarks"
//! is the first menu entry rather than a convenience extra.

use tauri::menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter};

use crate::window;

/// Events the tray sends to the frontend. The popup listens for these and
/// opens the matching view.
pub const EVENT_ADD_LINK: &str = "crumb://add-link";
pub const EVENT_ADD_CLIPBOARD: &str = "crumb://add-clipboard";
pub const EVENT_OPEN_SETTINGS: &str = "crumb://open-settings";

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Bookmarks", true, None::<&str>)?;
    let add = MenuItem::with_id(app, "add", "Add Link", true, None::<&str>)?;
    let clip = MenuItem::with_id(app, "clip", "Add Clipboard URL", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Crumb", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open, &add, &clip, &settings, &sep, &quit])?;

    TrayIconBuilder::with_id("crumb-tray")
        .icon(app.default_window_icon().expect("bundled window icon").clone())
        .icon_as_template(true)
        .tooltip("Crumb — bookmark launcher")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(on_menu_event)
        .on_tray_icon_event(on_tray_event)
        .build(app)?;

    Ok(())
}

fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    // Every entry but Quit is a view inside the popup, so each one shows the
    // window and then tells the frontend where to land.
    match event.id().as_ref() {
        "open" => open_popup(app, None),
        "add" => open_popup(app, Some(EVENT_ADD_LINK)),
        "clip" => open_popup(app, Some(EVENT_ADD_CLIPBOARD)),
        "settings" => open_popup(app, Some(EVENT_OPEN_SETTINGS)),
        "quit" => app.exit(0),
        _ => {}
    }
}

fn open_popup(app: &AppHandle, event: Option<&str>) {
    window::show_popup(app);
    if let Some(event) = event {
        let _ = app.emit(event, ());
    }
}

fn on_tray_event(tray: &TrayIcon, event: TrayIconEvent) {
    let app = tray.app_handle();
    tauri_plugin_positioner::on_tray_event(app, &event);

    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        window::toggle_popup(app);
    }
}
