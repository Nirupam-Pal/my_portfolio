"use client";

import { useEffect } from "react";

import { canHover, prefersReducedMotion } from "@/animations/gsap";

/**
 * Anything marked `data-pointer` knows where the pointer is over it, through CSS alone:
 * `--px` / `--py` run from -1 to 1 across it, `--mx` / `--my` are the same point in pixels,
 * and `data-pointer-in` is set while the pointer is inside. One listener serves the whole page,
 * read once a frame, so a card or a project stage can lean, drift or catch the light without a
 * script of its own. Touch screens and reduced motion get none of it.
 */
export function PointerField() {
  useEffect(() => {
    if (!canHover() || prefersReducedMotion()) return;

    let current: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    let frame = 0;

    const reset = (el: HTMLElement) => {
      el.removeAttribute("data-pointer-in");
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };

    const write = () => {
      frame = 0;
      if (!current) return;
      const r = current.getBoundingClientRect();
      const mx = x - r.left;
      const my = y - r.top;
      current.style.setProperty("--mx", `${mx.toFixed(1)}px`);
      current.style.setProperty("--my", `${my.toFixed(1)}px`);
      current.style.setProperty("--px", ((mx / r.width) * 2 - 1).toFixed(3));
      current.style.setProperty("--py", ((my / r.height) * 2 - 1).toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      const next = (e.target as Element | null)?.closest?.<HTMLElement>("[data-pointer]") ?? null;
      if (next !== current) {
        if (current) reset(current);
        current = next;
        current?.setAttribute("data-pointer-in", "");
      }
      if (current && !frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (current) reset(current);
    };
  }, []);

  return null;
}
