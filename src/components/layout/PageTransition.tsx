"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";
import { smooth } from "@/animations/scroll";

let startTransition: ((href: string, label: string) => void) | null = null;

export function navigateWithTransition(href: string, label: string) {
  if (startTransition) startTransition(href, label);
  else window.location.assign(href);
}

/** Two offset wipes and a line of type. The new route loads behind them, so nothing waits on the animation. */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pending = useRef<{ fallback: ReturnType<typeof setTimeout> } | null>(null);
  const previousPath = useRef(pathname);

  const reveal = useCallback(() => {
    const tl = gsap.timeline({
      delay: 0.08,
      onComplete: () => {
        if (rootRef.current) rootRef.current.style.visibility = "hidden";
        smooth.lenis?.start();
        ScrollTrigger.refresh();
      },
    });
    tl.to(labelRef.current, { yPercent: -110, duration: 0.45, ease: "expo.in" }, 0);
    tl.to(frontRef.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "expo.inOut" }, 0.12);
    tl.to(backRef.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "expo.inOut" }, 0.22);
  }, []);

  useEffect(() => {
    startTransition = (href, label) => {
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      const root = rootRef.current;
      if (!root || pending.current) return;

      smooth.lenis?.stop();
      root.style.visibility = "visible";
      if (labelRef.current) labelRef.current.textContent = label;
      gsap.set([backRef.current, frontRef.current], { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(labelRef.current, { yPercent: 110 });

      const tl = gsap.timeline({
        onComplete: () => {
          // Never leave the screen covered if navigation stalls or the path does not change.
          const fallback = setTimeout(() => {
            pending.current = null;
            reveal();
          }, 4000);
          // A same-path target (for example "/#work" from "/") settles without a path change.
          pending.current = { fallback };
          router.push(href, { scroll: false });
        },
      });
      tl.to(backRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.62, ease: "expo.inOut" }, 0);
      tl.to(frontRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.62, ease: "expo.inOut" }, 0.09);
      tl.to(labelRef.current, { yPercent: 0, duration: 0.55, ease: "expo.out" }, 0.3);
    };

    return () => {
      startTransition = null;
    };
  }, [router, reveal]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    if (!window.location.hash) {
      if (smooth.lenis) smooth.lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
    }

    if (!pending.current) return;
    clearTimeout(pending.current.fallback);
    pending.current = null;

    reveal();
    document.querySelector("main")?.focus({ preventScroll: true });
  }, [pathname, reveal]);

  return (
    <div ref={rootRef} aria-hidden="true" className="z-transition pointer-events-none fixed inset-0 invisible">
      <div ref={backRef} className="bg-violet absolute inset-0" style={{ clipPath: "inset(100% 0% 0% 0%)" }} />
      <div
        ref={frontRef}
        className="bg-ink-1 absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(100% 0% 0% 0%)" }}
      >
        <span className="block overflow-hidden">
          <span ref={labelRef} className="display block text-[clamp(2.5rem,8vw,7rem)]" />
        </span>
      </div>
    </div>
  );
}
