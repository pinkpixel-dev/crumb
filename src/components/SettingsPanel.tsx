import { useEffect, useState } from "react";
import { ArrowLeft, Keyboard } from "lucide-react";

import { APP_NAME, APP_VERSION } from "../lib/app-info";
import { accelizeEvent, formatAccelerator } from "../lib/shortcut";
import { bookmarksPath } from "../lib/storage";
import type { Settings, Theme } from "../types/settings";

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
};

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  const [path, setPath] = useState("");
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    bookmarksPath()
      .then(setPath)
      .catch(() => setPath(""));
  }, []);

  const onRecordKey = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (event.key === "Escape") {
      setRecording(false);
      return;
    }

    const accelerator = accelizeEvent(event);
    if (!accelerator) return;

    onChange({ globalShortcut: accelerator });
    setRecording(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          title="Back"
          className="grid size-6 shrink-0 place-items-center rounded text-faint
                     transition-colors hover:bg-hover hover:text-ink"
        >
          <ArrowLeft size={14} aria-hidden="true" />
        </button>
        <h2 className="font-display text-[15px] text-ink">Settings</h2>
      </div>

      <Row label="Theme">
        <div
          role="group"
          aria-label="Theme"
          className="flex w-fit items-center gap-0.5 rounded-md border border-line bg-surface p-0.5"
        >
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => onChange({ theme: theme.value })}
              aria-pressed={settings.theme === theme.value}
              className={`h-6 rounded px-2 text-[11px] transition-colors ${
                settings.theme === theme.value
                  ? "bg-accent-soft text-ink"
                  : "text-dim hover:bg-hover hover:text-ink"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </Row>

      <Row
        label="Global shortcut"
        hint="Opens Crumb from anywhere. Press Escape while recording to keep the current one."
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRecording(true)}
            onKeyDown={recording ? onRecordKey : undefined}
            onBlur={() => setRecording(false)}
            aria-label="Change global shortcut"
            className={`flex h-7 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px]
                        transition-colors ${
                          recording
                            ? "border-accent text-accent"
                            : "border-line bg-surface text-ink hover:bg-hover"
                        }`}
          >
            <Keyboard size={12} aria-hidden="true" />
            {recording ? "Press keys…" : formatAccelerator(settings.globalShortcut)}
          </button>
          {settings.globalShortcut && !recording && (
            <button
              type="button"
              onClick={() => onChange({ globalShortcut: "" })}
              className="h-7 rounded-md px-2 text-[11px] text-faint transition-colors
                         hover:bg-hover hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </Row>

      <Toggle
        label="Launch at startup"
        checked={settings.launchAtStartup}
        onChange={(launchAtStartup) => onChange({ launchAtStartup })}
      />

      <Toggle
        label="Confirm before deleting"
        checked={settings.confirmDelete}
        onChange={(confirmDelete) => onChange({ confirmDelete })}
      />

      <div className="mt-1 border-t border-line pt-2.5">
        <p className="text-[10.5px] text-faint">Bookmarks are stored at</p>
        <p className="mt-0.5 font-mono text-[10px] break-all text-dim select-text">
          {path || "resolving…"}
        </p>
        <p className="mt-2 text-[10.5px] text-faint">
          {APP_NAME} v{APP_VERSION} · Made with 💖 by Pink Pixel
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-dim">{label}</span>
      {children}
      {hint && <span className="text-[10.5px] leading-snug text-faint">{hint}</span>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 select-none">
      <span className="text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 shrink-0 accent-[var(--c-accent)]"
      />
    </label>
  );
}
