import { useCallback, useEffect, useState } from "react";

import * as storage from "../lib/storage";
import { applyTheme, watchSystemTheme } from "../lib/theme";
import { DEFAULT_SETTINGS, type Settings } from "../types/settings";

type UseSettings = {
  settings: Settings;
  ready: boolean;
  /** Non-fatal problem from the last update, such as an unusable shortcut. */
  error: string | null;
  update: (patch: Partial<Settings>) => Promise<void>;
  dismissError: () => void;
};

/**
 * Loads settings once, then persists every change and runs the side effects
 * that belong to it: theme, global hotkey and autostart registration.
 */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    storage
      .loadSettings()
      .then((loaded) => {
        if (!active) return;
        setSettings(loaded);
        applyTheme(loaded.theme);
      })
      .catch((err) => active && setError(String(err)))
      .finally(() => active && setReady(true));

    return () => {
      active = false;
    };
  }, []);

  // Follow the OS while the theme is set to "system".
  useEffect(
    () => watchSystemTheme(settings.theme, () => applyTheme(settings.theme)),
    [settings.theme],
  );

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      applyTheme(next.theme);

      try {
        await storage.saveSettings(next);

        if (patch.globalShortcut !== undefined) {
          await storage.setGlobalShortcut(next.globalShortcut);
        }
        if (patch.launchAtStartup !== undefined) {
          await storage.setLaunchAtStartup(next.launchAtStartup);
        }
        setError(null);
      } catch (err) {
        // The setting is already saved and shown; only the side effect failed,
        // so surface it rather than rolling the whole change back.
        setError(String(err));
      }
    },
    [settings],
  );

  const dismissError = useCallback(() => setError(null), []);

  return { settings, ready, error, update, dismissError };
}
