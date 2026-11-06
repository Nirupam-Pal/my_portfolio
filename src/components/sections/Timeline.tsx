"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";
import { experience } from "@/data/experience";

export function Timeline() {
  const rootRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(experience[0].id);
  const [reached, setReached] = useState(-1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      if (fillRef.current) fillRef.current.style.transform = "scaleY(1)";
      // Known only on the client, so it cannot be the initial state without a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReached(experience.length);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        fillRef.current,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 62%", end: "bottom 62%", scrub: true } },
      );

      gsap.utils.toArray<HTMLElement>("[data-milestone]", root).forEach((el, i) => {
        // Each milestone opens as the light reaches it.
        ScrollTrigger.create({
          trigger: el,
          start: "top 62%",
          onEnter: () => {
            setReached((r) => Math.max(r, i));
            setOpen(experience[i].id);
          },
          onLeaveBack: () => setReached(i - 1),
        });
        gsap.from(el.querySelectorAll("[data-rise]"), {
          y: 34,
          autoAlpha: 0,
          rotateX: 14,
          transformPerspective: 800,
          duration: 1.1,
          stagger: 0.09,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <ol ref={rootRef} className="relative mt-16 max-w-[52rem] list-none p-0 lg:mt-24 lg:ml-[8.33vw]">
      <div aria-hidden="true" className="bg-line absolute top-1 bottom-0 left-0 w-px">
        <div ref={fillRef} className="from-violet to-sky h-full origin-top bg-gradient-to-b shadow-[0_0_14px_rgb(56_189_248_/_0.55)]" />
      </div>

      {experience.map((item, i) => {
        const isOpen = open === item.id;
        const isReached = reached >= i;
        return (
          <li
            key={item.id}
            data-milestone
            data-pose={`experience-${item.id}`}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setOpen(item.id);
            }}
            className="relative pb-24 pl-8 last:pb-6 sm:pl-14"
          >
            <span
              aria-hidden="true"
              className={`absolute top-2 -left-[4px] h-[9px] w-[9px] border transition-all duration-700 ${
                isReached ? "bg-sky border-sky shadow-[0_0_16px_rgb(56_189_248_/_0.9)]" : "bg-ink-0 border-line-strong"
              }`}
            />

            <p data-rise className="label flex flex-wrap items-center gap-x-3 gap-y-1">
              <span aria-hidden="true" className={`text-[1rem] tracking-[0.04em] transition-colors duration-700 ${isReached ? "text-paper" : ""}`}>
                {item.start} <span className="text-mute mx-1">→</span> {item.end}
              </span>
              <span className="sr-only">{item.period}</span>
              <span aria-hidden="true" className="bg-line-strong hidden h-px w-8 sm:block" />
              <span>{item.place}</span>
            </p>

            <h3
              data-rise
              className={`display mt-4 text-[clamp(2.3rem,5.6vw,5.5rem)] transition-colors duration-700 ${isReached ? "text-paper" : "text-mute"}`}
            >
              {item.company}
            </h3>

            <p data-rise className="font-display mt-3 text-[clamp(1.1rem,1.6vw,1.5rem)] tracking-[-0.015em]">
              {item.role}
            </p>

            <div data-rise className="mt-5 max-w-[36rem]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`details-${item.id}`}
                className="group flex w-full items-start justify-between gap-6 text-left"
              >
                <span className="text-[1.0625rem] leading-relaxed">{item.summary}</span>
                <Plus
                  aria-hidden="true"
                  size={18}
                  className={`text-mute group-hover:text-paper mt-1 shrink-0 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
                />
              </button>
              <div id={`details-${item.id}`} className="disclosure" data-open={isOpen}>
                <div>
                  <ul className="text-mute border-line mt-4 space-y-2 border-t pt-4 leading-relaxed">
                    {item.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
