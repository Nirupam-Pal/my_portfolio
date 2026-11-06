"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { canHover, gsap, prefersReducedMotion } from "@/animations/gsap";

interface MagneticProps {
  children: ReactNode;
  /** Fraction of the pointer's distance from centre that the element follows. */
  strength?: number;
  className?: string;
}

/** Wraps any control so it leans towards the pointer and settles back when released. */
export function Magnetic({ children, strength = 0.32, className = "" }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canHover() || prefersReducedMotion()) return;

    const x = gsap.quickTo(el, "x", { duration: 0.9, ease: "elastic.out(1, 0.55)" });
    const y = gsap.quickTo(el, "y", { duration: 0.9, ease: "elastic.out(1, 0.55)" });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <span ref={ref} data-magnetic className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
