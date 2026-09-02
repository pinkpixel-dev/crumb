export type Theme = "system" | "light" | "dark";
export type ViewMode = "list" | "cards";

export type Settings = {
  theme: Theme;
  viewMode: ViewMode;
  /** Accelerator such as "CmdOrCtrl+Alt+B". Empty string disables the hotkey. */
  globalShortcut: string;
  launchAtStartup: boolean;
  confirmDelete: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  viewMode: "list",
  globalShortcut: "CmdOrCtrl+Alt+B",
  launchAtStartup: false,
  confirmDelete: true,
};
