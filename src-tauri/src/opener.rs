//! Opening bookmarks in the user's default browser.
//!
//! This deliberately does not use `tauri_plugin_opener::open_url` on Linux, for
//! two reasons that together produce a link that silently does nothing.
//!
//! The plugin spawns the launcher detached and returns success the moment the
//! process starts, so a browser that fails a moment later still looks like it
//! worked. And every child process inherits Crumb's own environment, which
//! inside an AppImage points at the GTK and glib libraries bundled under
//! `/tmp/.mount_*`. A browser started with those variables loads the wrong
//! libraries and dies before it draws a window. The popup would hide, no
//! browser would appear, and nothing anywhere reported an error.
//!
//! So on Linux the launcher is started here with the bundle's variables taken
//! back out, and its exit status is watched long enough to catch an immediate
//! failure and turn it into something the user can actually read. Other
//! platforms have neither problem and go through the plugin unchanged.

/// Only these schemes are ever handed to a launcher. The frontend normalises
/// every stored URL, but this runs on whatever the IPC layer is given, so it
/// checks again rather than trusting the caller.
const ALLOWED_SCHEMES: [&str; 2] = ["http://", "https://"];

pub fn open_url(url: &str) -> Result<(), String> {
    let url = url.trim();

    if !ALLOWED_SCHEMES
        .iter()
        .any(|scheme| url.len() > scheme.len() && url.to_lowercase().starts_with(scheme))
    {
        return Err("Only http and https links can be opened.".into());
    }

    // A launcher takes the URL as a shell word. Whitespace or a control
    // character in it means the value was never a single URL to begin with.
    if url.chars().any(|c| c.is_whitespace() || c.is_control()) {
        return Err("That link contains characters a browser cannot accept.".into());
    }

    launch(url)
}

#[cfg(not(target_os = "linux"))]
fn launch(url: &str) -> Result<(), String> {
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|err| err.to_string())
}

#[cfg(target_os = "linux")]
use linux::launch;

#[cfg(target_os = "linux")]
mod linux {
    use std::env;
    use std::process::{Child, Command, Stdio};
    use std::sync::mpsc;
    use std::thread;
    use std::time::Duration;

    /// How long to watch the launcher before assuming the URL was handed over.
    ///
    /// A launcher that is going to fail fails at once. One that is still
    /// running after this has already passed the URL along and may well stay
    /// alive for as long as the browser does, so waiting for it to finish would
    /// mean waiting for the user to close their browser.
    const LAUNCH_GRACE: Duration = Duration::from_millis(1500);

    /// Variables that carry no useful meaning outside Crumb's own process and
    /// would only confuse a browser. `GIO_MODULE_DIR` and `GIO_EXTRA_MODULES`
    /// are on the list because Crumb sets them itself at startup, pointing at a
    /// path that does not exist, to keep the AppImage's bundled GIO modules
    /// away from WebKitGTK. That trick is right for Crumb and wrong for
    /// everything Crumb launches.
    const DROPPED: [&str; 6] = [
        "APPDIR",
        "APPIMAGE",
        "ARGV0",
        "OWD",
        "GIO_MODULE_DIR",
        "GIO_EXTRA_MODULES",
    ];

    pub fn launch(url: &str) -> Result<(), String> {
        let mut last_error = None;

        for (program, args) in [("xdg-open", vec![url]), ("gio", vec!["open", url])] {
            let mut command = Command::new(program);
            command.args(args);
            clean_environment(&mut command);

            match run(&mut command, program) {
                Ok(()) => return Ok(()),
                Err(err) => last_error = Some(err),
            }
        }

        Err(last_error.unwrap_or_else(|| "No way to open links was available.".into()))
    }

    /// Strip the running AppImage's mount point out of everything the child
    /// would inherit.
    ///
    /// Rather than listing the variables the AppImage runtime rewrites, this
    /// looks at every variable holding the mount path and removes just those
    /// entries. That restores each one to what it held before Crumb started,
    /// keeps genuine system entries such as `/usr/share` in `XDG_DATA_DIRS`,
    /// and does not need updating when the runtime learns a new variable.
    ///
    /// Outside an AppImage there is no mount point and the environment is
    /// passed through untouched.
    fn clean_environment(command: &mut Command) {
        for key in DROPPED {
            command.env_remove(key);
        }

        let Some(bundle) = env::var_os("APPDIR") else {
            return;
        };
        let Some(bundle) = bundle.to_str().map(str::to_owned).filter(|s| !s.is_empty()) else {
            return;
        };

        for (key, value) in env::vars() {
            if !value.contains(&bundle) {
                continue;
            }

            match without_bundle(&value, &bundle) {
                Some(kept) => {
                    command.env(&key, kept);
                }
                None => {
                    command.env_remove(&key);
                }
            }
        }
    }

    /// A colon-separated value with every entry inside the bundle taken out, or
    /// `None` when that leaves nothing worth passing on.
    pub(super) fn without_bundle(value: &str, bundle: &str) -> Option<String> {
        let kept: Vec<&str> = value
            .split(':')
            .filter(|entry| !entry.is_empty() && !entry.starts_with(bundle))
            .collect();

        if kept.is_empty() {
            None
        } else {
            Some(kept.join(":"))
        }
    }

    /// Start the launcher and watch it just long enough to catch a failure.
    ///
    /// The wait happens on its own thread so the child is always reaped, even
    /// when the grace period runs out first and this returns without it.
    fn run(command: &mut Command, program: &str) -> Result<(), String> {
        let child = command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|err| format!("{program} could not be started: {err}"))?;

        match wait_briefly(child) {
            // Finished in time and said it worked.
            Some(Ok(())) => Ok(()),
            Some(Err(err)) => Err(format!("{program} {err}")),
            // Still running, so it has the URL and is getting on with it.
            None => Ok(()),
        }
    }

    fn wait_briefly(mut child: Child) -> Option<Result<(), String>> {
        let (tx, rx) = mpsc::channel();

        thread::spawn(move || {
            let _ = tx.send(child.wait());
        });

        match rx.recv_timeout(LAUNCH_GRACE) {
            Ok(Ok(status)) if status.success() => Some(Ok(())),
            Ok(Ok(status)) => Some(Err(match status.code() {
                Some(code) => format!("failed with exit code {code}"),
                None => "was stopped before it could open the link".into(),
            })),
            Ok(Err(err)) => Some(Err(format!("could not be waited on: {err}"))),
            Err(_) => None,
        }
    }
}

#[cfg(all(test, target_os = "linux"))]
mod environment_tests {
    use super::linux::without_bundle;

    const BUNDLE: &str = "/tmp/.mount_Crumb_GPEGae";

    #[test]
    fn keeps_the_system_half_of_a_search_path() {
        // XDG_DATA_DIRS as the AppImage runtime leaves it. The browser still
        // needs the system entries to find anything it looks up by name.
        let value = "/tmp/.mount_Crumb_GPEGae/usr/share/:/tmp/.mount_Crumb_GPEGae/usr/share\
                     :/usr/share:/var/lib/flatpak/exports/share:/usr/local/share";

        assert_eq!(
            without_bundle(value, BUNDLE).as_deref(),
            Some("/usr/share:/var/lib/flatpak/exports/share:/usr/local/share"),
        );
    }

    #[test]
    fn removes_a_value_that_is_only_bundle_paths() {
        // GTK_PATH and friends point nowhere else, so the browser should not
        // receive them at all rather than receive an empty string.
        let value = "/tmp/.mount_Crumb_GPEGae//usr/lib/gtk-3.0";

        assert_eq!(without_bundle(value, BUNDLE), None);
    }

    #[test]
    fn keeps_entries_the_user_had_before_crumb_started() {
        // The runtime prepends to LD_LIBRARY_PATH, so whatever trails it was
        // the user's own and has to survive.
        let value = "/tmp/.mount_Crumb_GPEGae/usr/lib/:/tmp/.mount_Crumb_GPEGae/lib64/:/opt/cuda/lib64";

        assert_eq!(without_bundle(value, BUNDLE).as_deref(), Some("/opt/cuda/lib64"));
    }

    #[test]
    fn drops_the_empty_entry_a_trailing_colon_leaves_behind() {
        // PERLLIB ends in a colon, and an empty PATH-style entry means "the
        // current directory", which is not something to hand a browser.
        let value = "/tmp/.mount_Crumb_GPEGae/usr/share/perl5/:/usr/bin/vendor_perl:";

        assert_eq!(
            without_bundle(value, BUNDLE).as_deref(),
            Some("/usr/bin/vendor_perl"),
        );
    }

    #[test]
    fn leaves_a_path_outside_the_bundle_alone() {
        let value = "/usr/bin:/usr/local/bin";

        assert_eq!(without_bundle(value, BUNDLE).as_deref(), Some(value));
    }
}

#[cfg(test)]
mod tests {
    use super::open_url;

    #[test]
    fn rejects_everything_that_is_not_a_web_link() {
        for url in [
            "",
            "   ",
            "http://",
            "https://",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "example.com",
            "--version",
        ] {
            assert!(open_url(url).is_err(), "should have rejected {url:?}");
        }
    }

    #[test]
    fn rejects_links_that_are_not_a_single_word() {
        for url in [
            "https://example.com /etc/passwd",
            "https://example.com\n--version",
            "https://exa\tmple.com",
        ] {
            assert!(open_url(url).is_err(), "should have rejected {url:?}");
        }
    }
}
