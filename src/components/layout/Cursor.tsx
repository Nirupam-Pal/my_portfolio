"use client";

import { useEffect, useRef, useState } from "react";

import { canHover, gsap, prefersReducedMotion } from "@/animations/gsap";

type CursorState = "default" | "link" | "view" | "drag" | "hidden";

/** What each state says when the element under it does not name its own action with `data-cursor-label`. */
const LABELS: Partial<Record<CursorState, string>> = { view: "View", drag: "Drag" };

/**
 * A trailing ring that is drawn towards magnetic targets and says what the hand can do there:
 * open a case study, throw a card aside. It gives under a press, so a click is felt as well as seen.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  // GSAP moves the holder; the face inside it changes size and gives under a press, so the two never fight over a transform.
  const ringRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
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
    const face = faceRef.current;
    if (!ring || !dot || !label || !face) return;

    const ringX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "none" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "none" });

    let magnet: HTMLElement | null = null;
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set([ring, dot], { autoAlpha: 0 });

    const setState = (state: CursorState, text?: string) => {
      face.dataset.state = state;
      label.textContent = text || LABELS[state] || "";
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
      if (explicit) setState(explicit.dataset.cursor as CursorState, explicit.dataset.cursorLabel);
      else if (target.closest("a, button, summary, [role='button']")) setState("link");
      else setState("default");
    };

    const onLeave = () => gsap.set([ring, dot], { autoAlpha: 0 });
    const onDown = () => face.setAttribute("data-pressed", "");
    const onUp = () => face.removeAttribute("data-pressed");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="z-cursor pointer-events-none fixed inset-0">
      <div ref={ringRef} className="fixed top-0 left-0">
        <div
          ref={faceRef}
          data-state="default"
          className="cursor-ring border-line-strong absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-full border"
        >
          <span ref={labelRef} className="cursor-label text-ink-0 font-mono text-[0.68rem] font-medium tracking-[0.14em] uppercase" />
        </div>
      </div>
      <div ref={dotRef} className="bg-paper fixed top-0 left-0 h-1 w-1 rounded-full transition-opacity" />
    </div>
  );
}
