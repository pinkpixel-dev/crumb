import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { ActionBar } from "./components/ActionBar";
import { AddBookmark } from "./components/AddBookmark";
import { CARD_COLUMNS } from "./components/BookmarkList";
import { FavoritesSection } from "./components/FavoritesSection";
import { LinksSection } from "./components/LinksSection";
import { ContextMenu, type MenuTarget } from "./components/ContextMenu";
import { Dialog, type DialogAction } from "./components/Dialog";
import { FAVORITE_COLUMNS } from "./components/FavoriteGrid";
import { SearchBar } from "./components/SearchBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { ViewToggle } from "./components/ViewToggle";
import { useAutoResize } from "./hooks/useAutoResize";
import { useBookmarks } from "./hooks/useBookmarks";
import { useNavigation } from "./hooks/useNavigation";
import { useSettings } from "./hooks/useSettings";
import { useTrayEvents } from "./hooks/useTrayEvents";
import { favorites as pickFavorites, findDuplicate, others } from "./lib/bookmarks";
import { searchBookmarks } from "./lib/search";
import { clipboardText, hidePopup } from "./lib/storage";
import { isValidUrl } from "./lib/urls";
import type { Bookmark, BookmarkDraft } from "./types/bookmark";

type View = "browse" | "form" | "settings";

export default function App() {
  const store = useBookmarks();
  const { settings, update: updateSettings, error: settingsError, dismissError } = useSettings();

  const [view, setView] = useState<View>("browse");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [pending, setPending] = useState<BookmarkDraft | null>(null);
  const [deleting, setDeleting] = useState<Bookmark | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const shell = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useAutoResize(shell);

  // While searching, matches are shown as one ranked list. Splitting them into
  // favourites and everything else would scatter the results the user is
  // scanning through.
  const searching = query.trim().length > 0;
  const matches = useMemo(
    () => searchBookmarks(store.bookmarks, query),
    [store.bookmarks, query],
  );
  const favorites = useMemo(
    () => (searching ? [] : pickFavorites(store.bookmarks)),
    [searching, store.bookmarks],
  );
  const rest = useMemo(
    () => (searching ? matches : others(store.bookmarks)),
    [matches, searching, store.bookmarks],
  );
  const flat = useMemo(() => [...favorites, ...rest], [favorites, rest]);

  const nav = useNavigation([
    { count: favorites.length, columns: FAVORITE_COLUMNS },
    { count: rest.length, columns: settings.viewMode === "cards" ? CARD_COLUMNS : 1 },
  ]);

  const open = useCallback(async (bookmark: Bookmark) => {
    try {
      await openUrl(bookmark.url);
      await hidePopup();
    } catch (err) {
      setNotice(`Could not open that link: ${err}`);
    }
  }, []);

  const backToBrowse = useCallback(() => {
    setView("browse");
    setEditing(null);
    setFormUrl("");
  }, []);

  const startAdd = useCallback((url = "") => {
    setEditing(null);
    setFormUrl(url);
    setView("form");
  }, []);

  const addFromClipboard = useCallback(async () => {
    try {
      const text = await clipboardText();
      if (!isValidUrl(text)) {
        setNotice("The clipboard does not have a web address in it.");
        return;
      }
      startAdd(text.trim());
    } catch (err) {
      setNotice(`Could not read the clipboard: ${err}`);
    }
  }, [startAdd]);

  const saveDraft = useCallback(
    (draft: BookmarkDraft) => {
      if (editing) {
        store.edit(editing.id, draft);
        backToBrowse();
        return;
      }

      const duplicate = findDuplicate(store.bookmarks, draft.url);
      if (duplicate) {
        setPending(draft);
        return;
      }

      store.add(draft);
      backToBrowse();
    },
    [backToBrowse, editing, store],
  );

  const confirmDelete = useCallback(
    (bookmark: Bookmark) => {
      if (settings.confirmDelete) {
        setDeleting(bookmark);
        return;
      }
      store.remove(bookmark.id);
    },
    [settings.confirmDelete, store],
  );

  const copyUrl = useCallback(async (bookmark: Bookmark) => {
    try {
      await writeText(bookmark.url);
      setNotice("Link copied.");
    } catch (err) {
      setNotice(`Could not copy that link: ${err}`);
    }
  }, []);

  useTrayEvents({
    onAddLink: () => startAdd(),
    onAddClipboard: () => void addFromClipboard(),
    onOpenSettings: () => setView("settings"),
    onShown: () => {
      setNotice(null);
      searchInput.current?.focus();
      searchInput.current?.select();
    },
  });

  const modalOpen = pending !== null || deleting !== null;

  // Keys are handled on the window rather than on the shell, so shortcuts work
  // no matter which control happens to hold focus, including nothing at all.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (modalOpen || menu) return;

      const target = event.target as HTMLElement | null;
      const inSearch = target === searchInput.current;
      const inField = target instanceof HTMLInputElement;
      // Enter and Space belong to whatever control is focused.
      const onControl = Boolean(target?.closest("button")) || (inField && !inSearch);

      if (event.key === "Escape") {
        event.preventDefault();
        if (view !== "browse") backToBrowse();
        else if (query) setQuery("");
        else void hidePopup();
        return;
      }

      if (event.key.toLowerCase() === "n" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        startAdd();
        return;
      }

      if (view !== "browse") return;

      if (event.key.toLowerCase() === "f" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        searchInput.current?.focus();
        searchInput.current?.select();
        return;
      }

      if (event.key === "/" && !inField) {
        event.preventDefault();
        searchInput.current?.focus();
        return;
      }

      if (event.key === "Enter" && !onControl && nav.index >= 0 && flat[nav.index]) {
        event.preventDefault();
        void open(flat[nav.index]);
        return;
      }

      // Alt plus an arrow key reorders favourites; the grid handles that.
      if (event.altKey) return;

      if (nav.handleKey(event.key)) event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backToBrowse, flat, menu, modalOpen, nav, open, query, startAdd, view]);

  // The shell is sized by its content, capped at the window maximum. Nothing
  // inside it may stretch: a flex-1 child would fill the window, so
  // useAutoResize would measure the window height straight back to itself and
  // the popup could grow but never shrink.
  return (
    <div
      ref={shell}
      className="relative flex max-h-[600px] flex-col overflow-hidden rounded-[var(--radius-popup)]
                 border border-line bg-bg"
    >
      {view === "browse" && (
        <>
          <header className="flex shrink-0 items-center gap-1.5 border-b border-line px-2 py-2">
            <SearchBar ref={searchInput} value={query} onChange={setQuery} />
            <ViewToggle
              value={settings.viewMode}
              onChange={(viewMode) => updateSettings({ viewMode })}
            />
          </header>

          <FavoritesSection
            items={favorites}
            selected={nav.index < favorites.length ? nav.index : -1}
            onOpen={open}
            onContextMenu={(bookmark, x, y) => setMenu({ bookmark, x, y })}
            onReorder={store.reorderFavorite}
            onHover={nav.setIndex}
          />

          <ActionBar
            onAdd={() => startAdd()}
            onAddClipboard={() => void addFromClipboard()}
            onOpenSettings={() => setView("settings")}
          />

          <div className="scroll-thin min-h-0 overflow-y-auto">
            <LinksSection
              items={rest}
              total={store.bookmarks.length}
              searching={searching}
              viewMode={settings.viewMode}
              offset={favorites.length}
              selected={nav.index}
              onOpen={open}
              onToggleFavorite={store.toggleFavorite}
              onContextMenu={(bookmark, x, y) => setMenu({ bookmark, x, y })}
              onHover={nav.setIndex}
            />
          </div>

        </>
      )}

      {view === "form" && (
        <AddBookmark
          editing={editing}
          initialUrl={formUrl}
          onSave={saveDraft}
          onCancel={backToBrowse}
        />
      )}

      {view === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={backToBrowse}
        />
      )}

      {menu && (
        <ContextMenu
          target={menu}
          onClose={() => setMenu(null)}
          onOpen={open}
          onToggleFavorite={store.toggleFavorite}
          onEdit={(bookmark) => {
            setEditing(bookmark);
            setFormUrl("");
            setView("form");
          }}
          onCopy={copyUrl}
          onDelete={confirmDelete}
        />
      )}

      {pending && (
        <Dialog
          title="You already saved this link"
          message="Crumb found an existing bookmark pointing at the same address."
          onDismiss={() => setPending(null)}
          actions={duplicateActions(
            () => {
              const existing = findDuplicate(store.bookmarks, pending.url);
              setPending(null);
              backToBrowse();
              if (existing) void open(existing);
            },
            () => {
              store.add(pending);
              setPending(null);
              backToBrowse();
            },
            () => setPending(null),
          )}
        />
      )}

      {deleting && (
        <Dialog
          title={`Delete "${deleting.title}"?`}
          message="This removes the bookmark from Crumb. It cannot be undone."
          onDismiss={() => setDeleting(null)}
          actions={[
            { label: "Cancel", onClick: () => setDeleting(null) },
            {
              label: "Delete",
              variant: "danger",
              onClick: () => {
                store.remove(deleting.id);
                setDeleting(null);
              },
            },
          ]}
        />
      )}

      {(notice || store.error || settingsError) && (
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            store.dismissError();
            dismissError();
          }}
          className="border-t border-line bg-surface px-3 py-1.5 text-left text-[10.5px]
                     leading-snug text-dim transition-colors hover:bg-hover"
        >
          {notice ?? store.error ?? settingsError}
        </button>
      )}
    </div>
  );
}

function duplicateActions(
  openExisting: () => void,
  saveAnyway: () => void,
  cancel: () => void,
): DialogAction[] {
  return [
    { label: "Cancel", onClick: cancel },
    { label: "Save anyway", onClick: saveAnyway },
    { label: "Open existing", variant: "primary", onClick: openExisting },
  ];
}
