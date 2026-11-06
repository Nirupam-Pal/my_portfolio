"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { prefersReducedMotion } from "@/animations/gsap";
import { observeReveals } from "@/animations/reveal";

/**
 * Inside a Suspense boundary this effect runs once the boundary has hydrated, so the reveals
 * never write inline styles onto markup React has yet to compare with what it renders.
 */
export function RevealScope({ children }: { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    return observeReveals(scopeRef.current);
  }, []);

  return (
    <div ref={scopeRef} data-reveal-scope className="contents">
      {children}
    </div>
  );
}
