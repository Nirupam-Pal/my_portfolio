import { gsap } from "./gsap";

type RevealKind = "chars" | "words" | "rise" | "clip" | "rule" | "perspective" | "stagger";

function play(el: HTMLElement): gsap.core.Animation[] {
  el.style.visibility = "visible";

  switch (el.dataset.reveal as RevealKind) {
    case "chars":
      return [gsap.from(el.querySelectorAll(".split-char"), { yPercent: 112, rotate: 4, duration: 1.25, ease: "expo.out", stagger: 0.022 })];
    case "words":
      return [gsap.from(el.querySelectorAll(".split-word"), { yPercent: 112, duration: 1.05, ease: "expo.out", stagger: 0.05 })];
    case "clip": {
      const clip = gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath" },
      );
      const image = el.querySelector("img");
      return image ? [clip, gsap.from(image, { scale: 1.2, duration: 1.8, ease: "expo.out" })] : [clip];
    }
    case "rule":
      return [gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 1.4, ease: "expo.inOut" })];
    case "perspective":
      return [
        gsap.from(el, {
          rotateX: 24,
          y: 70,
          autoAlpha: 0,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          duration: 1.3,
          ease: "expo.out",
        }),
      ];
    case "stagger":
      return [gsap.from(el.children, { y: 26, autoAlpha: 0, duration: 0.95, stagger: 0.07 })];
    default:
      return [gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.05 })];
  }
}

/**
 * One observer for every one-shot reveal. It works unchanged inside the sideways exhibition,
 * and unlike a ScrollTrigger per element it costs no layout reads at load or during scroll.
 * Each RevealScope looks after its own reveals; with no scope this takes the ones outside them all.
 */
export function observeReveals(scope: HTMLElement | null = null) {
  const animations = new Set<gsap.core.Animation>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          observer.unobserve(el);
          play(el).forEach((a) => animations.add(a));
        } else if (entry.boundingClientRect.bottom < 0) {
          // Already passed, as when arriving at a hash: nothing to watch being revealed.
          observer.unobserve(el);
          el.style.visibility = "visible";
        }
      });
    },
    { rootMargin: "0px -8% -10% 0px" },
  );
  const targets = [...(scope ?? document).querySelectorAll<HTMLElement>("[data-reveal]")].filter(
    (el) => el.closest("[data-reveal-scope]") === scope,
  );
  targets.forEach((el) => observer.observe(el));

  return () => {
    observer.disconnect();
    animations.forEach((a) => a.revert());
    targets.forEach((el) => el.style.removeProperty("visibility"));
  };
}
