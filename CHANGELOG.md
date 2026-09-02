# Changelog

All notable changes to Crumb are recorded here. This project follows semantic versioning.

## 0.1.0 - September 1, 2026

First release. Phases 1 through 3 of the project plan.

### 🗂️ Bookmarks

- Add, edit, and delete bookmarks, stored as plain JSON in the platform application data directory
- Atomic saves: a temporary file is written and then renamed over the real one
- A bookmark file that fails to parse is renamed to `bookmarks.json.corrupt` rather than deleted
- URL normalization, so `github.com` is accepted and stored as `https://github.com/`
- Duplicate detection that ignores scheme, `www.`, trailing slash, and case, with a prompt offering to open the existing bookmark instead

### 🖥️ Tray and popup

- System tray icon with a menu: Open Bookmarks, Add Link, Add Clipboard URL, Settings, Quit
- Left click toggles the popup where the platform reports click events
- Borderless popup with no taskbar entry, placed near the tray icon
- Falls back to the top right of the active monitor where the tray reports no geometry
- The window resizes itself to fit its content, between 220 and 600 points tall
- Hides on focus loss, on Escape, and on close, since quitting is a tray menu action
- A second launch shows the popup instead of starting another copy
- `CRUMB_NO_AUTOHIDE` keeps the popup open during development

### 🎨 Views

- Favorites shown as a compact icon grid
- Two layouts for the main list: rows, or small cards
- The layout choice is saved
- Light, dark, and follow-the-system themes

### 🔎 Site recognition

- Registry of 92 popular sites with their Simple Icons brand marks
- Public-suffix-aware domain matching, so `gist.github.com` resolves to GitHub and `example.co.uk` stays intact
- Favicon fallback, requested from the site's own origin rather than a third-party icon service
- Colored monogram fallback, keyed off a hash of the domain
- Near-black and near-white brand marks are drawn in the text color on the theme where they would disappear
- Recognized sites fill in their proper name when you add a link

### ⌨️ Keyboard and search

- Instant filtering over title, URL, hostname, and domain, with accents stripped
- Arrow key navigation that understands each layout, so Down moves a row in a grid and an item in a list
- `/` and `Ctrl+F` focus the search box, `Enter` opens, `Ctrl+N` adds, `Escape` steps back
- Optional global hotkey, `Ctrl+Alt+B` by default, recorded from a real keypress in Settings
- Favorites reorder by drag, or with `Alt` and an arrow key

### 🔧 Convenience

- Add Clipboard URL, from the footer or the tray menu
- Right-click a bookmark for open, favorite, edit, copy URL, and delete
- Launch at startup
- Optional confirmation before deleting
- Settings shows the exact path to your bookmark file
