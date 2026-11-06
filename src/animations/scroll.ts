import type Lenis from "lenis";

/** The single Lenis instance, for anything that needs to move or pause the page. */
export const smooth = { lenis: null as Lenis | null };

export function scrollToTarget(target: string | HTMLElement | number, immediate = false) {
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (element === null) return;

  if (smooth.lenis) {
    // Lenis caches the scroll limit, which is stale straight after a route change.
    smooth.lenis.resize();
    smooth.lenis.scrollTo(element, immediate ? { immediate: true, force: true } : { duration: 1.7, force: true });
    return;
  }

  // Native fallback: reduced motion, or before Lenis has started.
  const top = typeof element === "number" ? element : element.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "auto" });
}
