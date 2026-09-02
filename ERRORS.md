
## The popup grew but never shrank

**What did not work.** The scrolling list had `flex-1` so it would fill the popup. That makes the shell exactly as tall as the window at all times, so `useAutoResize` measured the window height and handed it back to Rust unchanged. The window grew when content forced it and then stayed there. Switching from list view to the shorter card view left a transparent strip at the bottom showing the desktop through it.

**What worked instead.** Removing `flex-1`. The shell is content-height with a `max-height` cap, every region except the list is `shrink-0`, and the list keeps `min-h-0` so it shrinks and scrolls when the total is too tall.

**Note for next time.** Anything measured by `ResizeObserver` to drive a window resize must not contain a stretching child, or the measurement is circular. Verified on the real window under `GDK_BACKEND=x11`, where `xdotool getwindowgeometry` can read it: list view reports 600 logical, card view 544.
