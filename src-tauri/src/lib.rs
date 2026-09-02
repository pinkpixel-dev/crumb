//! Crumb — a tiny bookmark launcher that lives in the system tray.

mod commands;
mod shortcuts;
mod storage;
mod tray;
mod window;

use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

/// Set this to any value during development to stop the popup from hiding when
/// it loses focus, which otherwise makes devtools impossible to use.
const NO_AUTOHIDE_ENV: &str = "CRUMB_NO_AUTOHIDE";

#[cfg(target_os = "linux")]
const DISABLED_APPIMAGE_GIO_MODULES: &str = "/__crumb_appimage_disabled_gio_modules__";

#[cfg(target_os = "linux")]
fn disabled_appimage_gio_modules_path(appimage: Option<&std::ffi::OsStr>) -> Option<&'static str> {
    appimage.map(|_| DISABLED_APPIMAGE_GIO_MODULES)
}

#[cfg(target_os = "linux")]
fn configure_appimage_gio_modules() {
    if let Some(path) = disabled_appimage_gio_modules_path(std::env::var_os("APPIMAGE").as_deref())
    {
        std::env::set_var("GIO_MODULE_DIR", path);
        std::env::set_var("GIO_EXTRA_MODULES", path);
    }
}

fn autohide_enabled() -> bool {
    std::env::var_os(NO_AUTOHIDE_ENV).is_none()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    configure_appimage_gio_modules();

    tauri::Builder::default()
        // Must be registered first so a second launch reaches the running app.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            window::show_popup(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    shortcuts::on_shortcut(app, shortcut, event.state());
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::load_bookmarks,
            commands::save_bookmarks,
            commands::load_settings,
            commands::save_settings,
            commands::bookmarks_path,
            commands::clipboard_text,
            commands::hide_popup,
            commands::resize_popup,
            commands::set_global_shortcut,
            commands::set_launch_at_startup,
        ])
        .on_window_event(|window, event| match event {
            // Closing the popup should tuck it away, not quit the app. Quit is
            // a deliberate choice from the tray menu.
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            WindowEvent::Focused(false) if autohide_enabled() => {
                let _ = window.hide();
            }
            _ => {}
        })
        .setup(|app| {
            let handle = app.handle().clone();

            // Crumb has no dock presence on macOS; it is a tray app only.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            tray::build(&handle)?;

            // Re-arm the saved hotkey. A stale or unavailable accelerator must
            // not stop the app from starting, so failure is logged and ignored.
            match storage::load_settings(&handle) {
                Ok(settings) => {
                    if let Err(err) = shortcuts::apply(&handle, &settings.global_shortcut) {
                        eprintln!("crumb: {err}");
                    }
                }
                Err(err) => eprintln!("crumb: could not load settings: {err}"),
            }

            // The window starts hidden; the tray icon is the way in.
            if let Some(popup) = app.get_webview_window(window::POPUP_LABEL) {
                let _ = popup.hide();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Crumb");
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::{disabled_appimage_gio_modules_path, DISABLED_APPIMAGE_GIO_MODULES};
    use std::ffi::OsStr;

    #[test]
    fn appimage_execution_disables_bundled_gio_modules() {
        assert_eq!(
            disabled_appimage_gio_modules_path(Some(OsStr::new("/tmp/Crumb.AppImage"))),
            Some(DISABLED_APPIMAGE_GIO_MODULES)
        );
    }

    #[test]
    fn normal_linux_execution_keeps_system_gio_modules() {
        assert_eq!(disabled_appimage_gio_modules_path(None), None);
    }
}
