# Crumb

Crumb is a small bookmark launcher that lives in your system tray. Click the tray icon, a compact popup appears, you click a link, and it opens in your default browser. That is the whole idea.

It exists because browser bookmarks are a filing cabinet and most of us only really need a shortcut drawer. Crumb holds the twenty or thirty links you actually reopen, recognizes the popular ones by their brand icon, and gets out of the way.

Everything is stored locally as a plain JSON file. No account, no sync, no telemetry.

![Crumb in list view](DOCS/images/list-dark.png)

## What it does

- Lives in the system tray and opens a popup near the tray icon
- Shows favorites as a compact icon grid at the top, above a fixed action bar
- Filters bookmarks as you type, matching title, URL, and domain
- Recognizes 92 popular sites and draws their real brand icon
- Falls back to the site's own favicon, then to a colored monogram
- Two layouts for the main list: rows, or small cards
- Opens links in your default browser and hides itself
- Adds whatever URL is on your clipboard in one click
- Optional global hotkey so you can open it from anywhere
- Light, dark, and follow-the-system themes
- Full keyboard control, including reordering favorites

## Requirements

You need these to build Crumb. You do not need them to run a packaged build.

- Node.js 20 or newer
- Rust 1.77 or newer
- The Tauri v2 system dependencies for your platform

On Linux you also need WebKitGTK 4.1 and a tray implementation. On Debian and Ubuntu:

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

On Arch:

```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl \
  libayatana-appindicator librsvg xdotool
```

## Build and run

```bash
git clone https://github.com/pinkpixel-dev/crumb.git
cd crumb
npm install
npm run tauri dev
```

For a packaged build:

```bash
npm run tauri build
```

The installers land in `src-tauri/target/release/bundle/`.

### A note on development

The popup hides itself the moment it loses focus, which makes devtools impossible to use. Set `CRUMB_NO_AUTOHIDE` to turn that off while you work:

```bash
CRUMB_NO_AUTOHIDE=1 npm run tauri dev
```

## Using it

Click the tray icon to open the popup. Click it again, press Escape, or click anywhere outside the popup to close it.

On most Linux desktops the tray does not pass left clicks to the application, so use the tray menu instead. "Open Bookmarks" is the first entry for exactly that reason.

### Adding a link

Click **Add link** in the bar under your favorites, or press `Ctrl+N`.

Paste or type the URL. Crumb fills in the title for you. For a site it recognizes you get the proper name, so `https://github.com/anything` becomes "GitHub". For anything else it guesses from the path and falls back to the hostname. Type your own title any time and Crumb stops guessing.

You do not need to type the scheme. `github.com` works, and gets stored as `https://github.com/`.

If you save a link you already have, Crumb tells you and offers to open the existing one instead.

### The clipboard shortcut

Copy a URL anywhere, then click the clipboard button next to Add link, or pick **Add Clipboard URL** from the tray menu. The add form opens with the URL already filled in. If the clipboard holds something that is not a web address, Crumb says so and does nothing.

### Favorites

Click the star on any row, or tick **Pin to favorites** when you add a link. Favorites move to the icon grid at the top.

Drag a tile to reorder the grid. If you would rather not use the mouse, focus a tile and hold `Alt` with an arrow key.

### The two layouts

The toggle in the top right switches the main list between rows and cards.

Rows are denser and show the URL under each title, so they suit a long list you scan by name. Cards are a tight four-column grid of icon tiles with the title underneath, which works better when you recognize links by their logo. Favorites stay a grid in both layouts, because that is already the right shape for them.

The Add link bar sits between your favorites and the list, not at the bottom of the popup, so it stays in the same place however many links you have.

Your choice is saved.

### Keyboard

| Key | Action |
|---|---|
| `/` or `Ctrl+F` | Focus the search box |
| `Arrow keys` | Move through favorites and the list |
| `Enter` | Open the selected bookmark |
| `Ctrl+N` | Add a bookmark |
| `Alt` + arrow | Move the focused favorite in the grid |
| `Escape` | Go back, clear the search, then close the popup |

Arrow keys understand the layout. In the favorites grid and in card view, Up and Down move a whole row. In list view they move one item.

There is also an optional global hotkey, set to `Ctrl+Alt+B` by default, which opens Crumb from any application. Change it or turn it off in Settings.

### Right-click a bookmark

Open, favorite or unfavorite, edit, copy the URL, or delete it. Delete asks first, unless you turn that off in Settings.

## Where your data lives

Crumb writes two files in the standard application data directory for your platform:

| Platform | Path |
|---|---|
| Linux | `~/.local/share/dev.pinkpixel.crumb/` |
| macOS | `~/Library/Application Support/dev.pinkpixel.crumb/` |
| Windows | `%APPDATA%\dev.pinkpixel.crumb\` |

`bookmarks.json` holds your links and `settings.json` holds your preferences. Settings shows you the exact path.

Saves are atomic. Crumb writes a temporary file and then renames it over the real one, so quitting mid-save cannot leave you with half a bookmark file. If the file ever does become unreadable, Crumb renames it to `bookmarks.json.corrupt` instead of deleting it, and tells you where it went.

A bookmark looks like this, so the file stays easy to edit by hand or back up:

```json
[
  {
    "id": "0c7f...",
    "title": "GitHub",
    "url": "https://github.com/",
    "favorite": true,
    "createdAt": 1788292800000,
    "sortOrder": 0
  }
]
```

## How the icons work

For each bookmark, Crumb tries three things in order.

First it checks the domain against a built-in registry of 92 sites and uses the matching Simple Icons SVG. Subdomains resolve correctly, so `gist.github.com` and `docs.github.com` both get the GitHub icon. Domain matching uses the public suffix list, which is why `example.co.uk` is treated as one domain rather than being cut down to `co.uk`.

If the site is not in the registry, Crumb loads the favicon from that site's own origin. It does not use a third-party icon service, so your list of bookmarks is never sent anywhere.

If the favicon does not load, you get a colored square with the first letter of the domain. The color comes from a hash of the domain, so a site always looks the same.

A few well-known brands are missing on purpose. Simple Icons removed CodePen, Canva, OpenAI, LinkedIn, Slack, and Amazon after trademark requests, so those use the favicon step instead.

## What it does not do

Crumb is meant to stay small. It has no accounts, no cloud sync, no tags, no folders, no browser extension, and no page archiving. If you want a real bookmark manager, this is not it.

It also does not fetch page titles yet. The title it suggests comes from the URL itself, not from the page.

Tested on Linux under KDE on Wayland. The macOS and Windows code paths are written and compile, but have not been run on those platforms yet.

## Built with

Tauri v2, React 19, TypeScript, Vite, and Tailwind CSS v4. Icons are Simple Icons for brands and Lucide for the interface. Domain parsing uses tldts.

## License

Apache 2.0. See [LICENSE](LICENSE).

Made with 💖 by [Pink Pixel](https://pinkpixel.dev)
