/**
 * Turning a keypress into a Tauri accelerator string.
 *
 * Tauri expects names like "CmdOrCtrl+Alt+B". Recording one from a real
 * keystroke avoids asking people to type that format by hand.
 */

/** Modifier-only presses cannot be a shortcut on their own. */
const MODIFIER_CODES = new Set([
  "ControlLeft", "ControlRight",
  "AltLeft", "AltRight",
  "ShiftLeft", "ShiftRight",
  "MetaLeft", "MetaRight",
]);

/**
 * Build an accelerator from a keydown, or return null if the press is not a
 * usable shortcut yet: a bare modifier, or a key with no modifier at all.
 */
export function accelizeEvent(event: KeyboardEvent | React.KeyboardEvent): string | null {
  if (MODIFIER_CODES.has(event.code)) return null;

  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("CmdOrCtrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = keyName(event.code, event.key);
  if (!key) return null;

  // A global hotkey without modifiers would swallow that key system-wide.
  if (parts.length === 0) return null;

  parts.push(key);
  return parts.join("+");
}

function keyName(code: string, key: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;

  const named: Record<string, string> = {
    Space: "Space",
    Enter: "Enter",
    Tab: "Tab",
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  };

  return named[code] ?? (key.length === 1 ? key.toUpperCase() : null);
}

/** Human-readable form for display, e.g. "Ctrl + Alt + B". */
export function formatAccelerator(accelerator: string, isMac = navigator.platform.startsWith("Mac")) {
  if (!accelerator) return "Off";

  return accelerator
    .split("+")
    .map((part) => {
      if (part === "CmdOrCtrl") return isMac ? "Cmd" : "Ctrl";
      return part;
    })
    .join(" + ");
}
