import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";

import { SiteIcon } from "./SiteIcon";
import { suggestedTitle } from "../lib/bookmarks";
import { isValidUrl } from "../lib/urls";
import type { Bookmark, BookmarkDraft } from "../types/bookmark";

type Props = {
  /** The bookmark being edited, or null when adding a new one. */
  editing: Bookmark | null;
  /** URL to start with, used by the clipboard shortcut. */
  initialUrl?: string;
  onSave: (draft: BookmarkDraft) => void;
  onCancel: () => void;
};

const EMPTY: BookmarkDraft = { url: "", title: "", favorite: false };

/**
 * The add and edit form.
 *
 * The title fills itself in from the URL until the user types their own, at
 * which point Crumb stops touching it. Saving a recognised site with an
 * untouched title stores the registry name rather than a bare hostname.
 */
export function AddBookmark({ editing, initialUrl = "", onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<BookmarkDraft>(
    editing
      ? { url: editing.url, title: editing.title, favorite: editing.favorite }
      : { ...EMPTY, url: initialUrl },
  );
  const [showError, setShowError] = useState(false);
  const titleTouched = useRef(Boolean(editing));
  const urlInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlInput.current?.focus();
    urlInput.current?.select();
  }, []);

  const valid = isValidUrl(draft.url);

  const setUrl = (url: string) => {
    setDraft((current) => ({
      ...current,
      url,
      title: titleTouched.current ? current.title : autoTitle(url),
    }));
    setShowError(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setShowError(true);
      urlInput.current?.focus();
      return;
    }
    onSave(draft);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3" noValidate>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          title="Back"
          className="grid size-6 shrink-0 place-items-center rounded text-faint
                     transition-colors hover:bg-hover hover:text-ink"
        >
          <ArrowLeft size={14} aria-hidden="true" />
        </button>
        <h2 className="font-display text-[15px] text-ink">
          {editing ? "Edit bookmark" : "Add bookmark"}
        </h2>
      </div>

      <Field label="URL" htmlFor="crumb-url">
        <div className="flex items-center gap-2">
          <span className="grid size-[18px] shrink-0 place-items-center">
            {valid ? <SiteIcon url={draft.url} size={17} /> : null}
          </span>
          <input
            id="crumb-url"
            ref={urlInput}
            type="text"
            value={draft.url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="github.com/pinkpixel-dev"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={showError}
            aria-describedby={showError ? "crumb-url-error" : undefined}
            className={`h-8 min-w-0 flex-1 rounded-md border bg-surface px-2 font-mono text-[11.5px]
                        text-ink placeholder:text-faint ${
                          showError ? "border-danger" : "border-line focus:border-line-strong"
                        }`}
          />
        </div>
      </Field>

      {showError && (
        <p id="crumb-url-error" role="alert" className="-mt-2 text-[11px] text-danger">
          That does not look like a web address. Crumb opens http and https links.
        </p>
      )}

      <Field label="Title" htmlFor="crumb-title">
        <input
          id="crumb-title"
          type="text"
          value={draft.title}
          onChange={(event) => {
            titleTouched.current = true;
            setDraft((current) => ({ ...current, title: event.target.value }));
          }}
          placeholder={valid ? autoTitle(draft.url) : "Named automatically"}
          autoComplete="off"
          className="h-8 w-full rounded-md border border-line bg-surface px-2 text-ink
                     placeholder:text-faint focus:border-line-strong"
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-dim select-none">
        <input
          type="checkbox"
          checked={draft.favorite}
          onChange={(event) =>
            setDraft((current) => ({ ...current, favorite: event.target.checked }))
          }
          className="size-3.5 accent-[var(--c-accent)]"
        />
        <Star
          size={12}
          aria-hidden="true"
          className={draft.favorite ? "text-accent" : "text-faint"}
          fill={draft.favorite ? "currentColor" : "none"}
        />
        Pin to favorites
      </label>

      <div className="flex items-center justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-7 rounded-md px-3 text-dim transition-colors hover:bg-hover hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="h-7 rounded-md bg-accent px-3 font-medium text-on-accent
                     transition-opacity hover:opacity-90 active:opacity-80"
        >
          {editing ? "Save changes" : "Save"}
        </button>
      </div>
    </form>
  );
}

function autoTitle(url: string): string {
  return isValidUrl(url) ? suggestedTitle(url) : "";
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-[11px] text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
