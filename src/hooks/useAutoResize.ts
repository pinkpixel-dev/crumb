import { useEffect, type RefObject } from "react";

import { resizePopup } from "../lib/storage";

/**
 * Keeps the window height matched to the content.
 *
 * A tray popup that is mostly empty should be short, and one with a long list
 * should stop growing and scroll instead. Rust clamps whatever it is given, so
 * this only has to report the measured height.
 */
export function useAutoResize(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      // Measure after layout settles, otherwise mid-transition heights leak
      // through and the window visibly stutters.
      frame = requestAnimationFrame(() => {
        void resizePopup(element.getBoundingClientRect().height);
      });
    };

    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);
}
