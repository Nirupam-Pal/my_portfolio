"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

import { rebuildAnchors, updateDirector } from "@/animations/director";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";
import { scrollToTarget, smooth } from "@/animations/scroll";

/** Lenis drives the scroll position, GSAP's ticker drives Lenis, and ScrollTrigger reads the result. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    if (!prefersReducedMotion()) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.105, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      smooth.lenis = lenis;
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // The scene follows the page on every GSAP frame, so 3D and DOM can never disagree.
    const follow = () => updateDirector(window.scrollY);
    gsap.ticker.add(follow);
    ScrollTrigger.addEventListener("refresh", rebuildAnchors);

    return () => {
      ScrollTrigger.removeEventListener("refresh", rebuildAnchors);
      gsap.ticker.remove(follow);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      smooth.lenis = null;
    };
  }, []);

  // Runs after page-level effects have created their triggers, so measurements include pin spacing.
  useEffect(() => {
    let cancelled = false;
    const settle = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      const { hash } = window.location;
      if (hash.length > 1) scrollToTarget(hash, true);
    };
    const raf = requestAnimationFrame(settle);
    // Web fonts change text metrics, and therefore every measured position. Skip the work if they already arrived.
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
