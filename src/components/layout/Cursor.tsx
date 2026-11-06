"use client";

import { useEffect, useRef, useState } from "react";

import { canHover, gsap, prefersReducedMotion } from "@/animations/gsap";

type CursorState = "default" | "link" | "view" | "drag" | "hidden";

const LABELS: Partial<Record<CursorState, string>> = { view: "View", drag: "Drag" };

/** A trailing ring that is drawn towards magnetic targets and announces what a click will do. */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!canHover() || prefersReducedMotion()) return;
    // Decided on the client only: touch devices and reduced motion keep the native cursor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    return () => document.documentElement.classList.remove("has-cursor");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;

    const ringX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "none" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "none" });

    let magnet: HTMLElement | null = null;
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const setState = (state: CursorState) => {
      ring.dataset.state = state;
      label.textContent = LABELS[state] ?? "";
      dot.style.opacity = state === "view" || state === "drag" ? "0" : "1";
    };

    const onMove = (e: PointerEvent) => {
      gsap.set([ring, dot], { autoAlpha: 1 });
      dotX(e.clientX);
      dotY(e.clientY);
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        ringX(r.left + r.width / 2 + (e.clientX - (r.left + r.width / 2)) * 0.35);
        ringY(r.top + r.height / 2 + (e.clientY - (r.top + r.height / 2)) * 0.35);
      } else {
        ringX(e.clientX);
        ringY(e.clientY);
      }
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) {
        setState("hidden");
        return;
      }
      const explicit = target.closest<HTMLElement>("[data-cursor]");
      magnet = target.closest<HTMLElement>("[data-magnetic]");
      if (explicit) setState(explicit.dataset.cursor as CursorState);
      else if (target.closest("a, button, summary, [role='button']")) setState("link");
      else setState("default");
    };

    const onLeave = () => gsap.set([ring, dot], { autoAlpha: 0 });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="z-cursor pointer-events-none fixed inset-0">
      <div
        ref={ringRef}
        data-state="default"
        className="cursor-ring border-line-strong fixed top-0 left-0 flex h-9 w-9 items-center justify-center rounded-full border"
      >
        <span ref={labelRef} className="cursor-label text-ink-0 font-mono text-[0.68rem] font-medium tracking-[0.14em] uppercase" />
      </div>
      <div ref={dotRef} className="bg-paper fixed top-0 left-0 h-1 w-1 rounded-full transition-opacity" />
    </div>
  );
}
