"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { registerAnchorProvider } from "@/animations/director";
import { scrollToTarget, smooth } from "@/animations/scroll";
import { EXHIBITION_QUERY, gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";
import { isPoseId } from "@/scenes/poses";

/**
 * Desktop: vertical scroll drives a sideways walk through the exhibition, while the 3D model
 * stays centre-stage and rebuilds itself for each project.
 * Everywhere else: ordinary vertical panels, with the same model showing through at the top of each.
 */
export function WorkExhibition({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add(EXHIBITION_QUERY, () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      track.setAttribute("data-pose-external", "");

      const walk = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      });

      const unregister = registerAnchorProvider(() => {
        const st = walk.scrollTrigger;
        if (!st) return [];
        const max = distance() || 1;
        const pad = 0.05;
        return gsap.utils.toArray<HTMLElement>("[data-panel]", track).flatMap((panel) => {
          const pose = panel.dataset.pose;
          if (!isPoseId(pose)) return [];
          const p = panel.offsetLeft / max;
          const at = (v: number) => st.start + v * (st.end - st.start);
          return [{ pose, from: at(Math.max(0, p - pad)), to: at(Math.min(1, p + pad)) }];
        });
      });

      // Layered captures move at their own rates: the sense of depth comes from these differences.
      track.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        const depth = Number(el.dataset.depth) || 4;
        gsap.fromTo(
          el,
          { x: () => (window.innerWidth * depth) / 100 },
          {
            x: () => (-window.innerWidth * depth) / 100,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("[data-panel]"),
              containerAnimation: walk,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });

      // The track only moves with the page, so keyboard focus has to bring the page along.
      // The browser would otherwise scroll the clipped viewport sideways and strand the layout.
      const onFocus = (e: FocusEvent) => {
        viewport.scrollLeft = 0;
        const st = walk.scrollTrigger;
        const target = e.target as HTMLElement;
        const panel = target.closest<HTMLElement>("[data-panel]");
        if (!st || !panel || !target.matches(":focus-visible")) return;
        const y = st.start + (panel.offsetLeft / (distance() || 1)) * (st.end - st.start);
        if (smooth.lenis) smooth.lenis.scrollTo(y, { duration: 0.9, force: true });
        else window.scrollTo(0, y);
      };
      const holdStill = () => {
        viewport.scrollLeft = 0;
      };
      track.addEventListener("focusin", onFocus);
      viewport.addEventListener("scroll", holdStill, { passive: true });

      // Sections hydrate one at a time, so the pin can appear after the page was first measured.
      ScrollTrigger.refresh();
      if (window.location.hash.length > 1) scrollToTarget(window.location.hash, true);

      return () => {
        track.removeEventListener("focusin", onFocus);
        viewport.removeEventListener("scroll", holdStill);
        unregister();
        track.removeAttribute("data-pose-external");
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={viewportRef} className="exhibit-viewport">
      <div ref={trackRef} className="exhibit-track">
        {children}
      </div>
    </div>
  );
}
