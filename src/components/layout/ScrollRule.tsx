"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { gsap, ScrollTrigger } from "@/animations/gsap";

const SHEETS: Record<string, string> = {
  home: "00 Elevation",
  about: "01 Section",
  work: "02 Selected Work",
  experience: "03 The Journey",
  skills: "04 Toolkit",
  achievements: "05 Milestones",
  education: "06 Foundation",
  contact: "07 Threshold",
};

/** The scroll indicator, drawn as an architect's dimension line, plus a title block naming the current sheet. */
export function ScrollRule() {
  const pathname = usePathname();
  const markerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (markerRef.current) markerRef.current.style.transform = `translateY(${self.progress * 100}%)`;
          if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
        },
      });
    });
    // The title block names whichever section crosses the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const label = SHEETS[entry.target.id];
          if (entry.isIntersecting && label && sheetRef.current) sheetRef.current.textContent = label;
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    Object.keys(SHEETS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, [pathname]);

  return (
    <div aria-hidden="true" className="z-chrome pointer-events-none fixed inset-0">
      <div className="absolute inset-x-0 top-0 h-0.5 lg:hidden">
        <div ref={barRef} className="bg-paper h-full origin-left" style={{ transform: "scaleX(0)" }} />
      </div>

      <div className="absolute top-1/2 right-[calc(var(--gutter)*0.42)] hidden h-[38vh] w-3 -translate-y-1/2 lg:block">
        <div className="bg-line absolute inset-y-0 right-0 w-px" />
        <div className="bg-line-strong absolute top-0 right-0 h-px w-3" />
        <div className="bg-line-strong absolute right-0 bottom-0 h-px w-3" />
        <div ref={markerRef} className="absolute inset-0" style={{ transform: "translateY(0%)" }}>
          <div className="bg-sky absolute top-0 right-0 h-px w-3" />
        </div>
      </div>

      <div className="label bg-ink-0/75 absolute bottom-4 left-[calc(var(--gutter)-0.5rem)] hidden px-2 py-1 text-[0.64rem] xl:block [@media(max-height:760px)]:hidden">
        The Digital Architect <span className="mx-2 opacity-50">/</span>
        <span ref={sheetRef} className="text-paper">
          {pathname === "/" ? SHEETS.home : "Case Study"}
        </span>
      </div>
    </div>
  );
}
