"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { gsap, prefersReducedMotion } from "@/animations/gsap";
import { observeReveals } from "@/animations/reveal";

/**
 * Sections stay Server Components and declare intent with data attributes.
 * This one client component turns those attributes into animation for the current page.
 */
export function Choreography() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const stopReveals = observeReveals();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax) || 10;
        gsap.fromTo(
          el,
          { yPercent: amount },
          {
            yPercent: -amount,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
        const amount = Number(el.dataset.drift) || 8;
        gsap.fromTo(
          el,
          { xPercent: amount },
          {
            xPercent: -amount,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // The hero's copy leaves as the camera moves into the machine.
      const heroCopy = document.querySelector("[data-hero-copy]");
      const heroName = document.querySelector("[data-hero-name]");
      const hero = document.querySelector("[data-hero]");
      if (hero && heroCopy && heroName) {
        const leave = gsap.timeline({
          scrollTrigger: { trigger: hero, start: "top top", end: "45% top", scrub: true },
        });
        leave.to(heroCopy, { autoAlpha: 0, y: -40, ease: "none" }, 0);
        leave.to(heroName, { yPercent: -14, scale: 1.05, autoAlpha: 0, transformOrigin: "30% 50%", ease: "none" }, 0);
      }
    });

    return () => {
      stopReveals();
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
