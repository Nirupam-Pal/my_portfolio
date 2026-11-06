"use client";

import { useEffect, useRef } from "react";

import { gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";

/** A small dimension line that stretches with scroll velocity, so it visibly responds to the first flick. */
export function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const stretch = gsap.quickTo(el, "scaleY", { duration: 0.5, ease: "power3" });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        stretch(1 + Math.min(Math.abs(self.getVelocity()) / 1800, 1.1));
        gsap.delayedCall(0.12, () => stretch(1));
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <div aria-hidden="true" className="ml-auto hidden items-center gap-3 pl-5 lg:flex">
      <span className="label text-[0.64rem]">Scroll</span>
      <div ref={ref} className="bg-line relative h-11 w-px origin-top overflow-hidden">
        <div className="scroll-tick bg-paper absolute inset-0" />
      </div>
    </div>
  );
}
