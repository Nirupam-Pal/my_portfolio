"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";

import { testimonials } from "@/data/testimonials";
import { sceneStore } from "@/scenes/store";

const SPRING = { type: "spring", stiffness: 150, damping: 24, mass: 0.9 } as const;
/** How far, or how fast, the card in front has to be thrown before the next one takes its place. */
const THROW = { distance: 70, speed: 420 };
const COUNT = testimonials.length;
const WIDE_QUERY = "(min-width: 768px)";

function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

/** Where a panel sits, by how many places it is from the one in focus: -1 behind and left, 1 behind and right. */
function placeFor(offset: number, wide: boolean) {
  if (offset === 0) return { x: "0%", y: 0, z: 0, rotateY: 0, scale: 1, opacity: 1 };
  const side = Math.sign(offset);
  return wide
    ? { x: `${side * 19}%`, y: 0, z: -170, rotateY: side * -10, scale: 0.94, opacity: 0.62 }
    : { x: `${side * 4}%`, y: side > 0 ? 34 : 20, z: -90, rotateY: side * -5, scale: 0.94, opacity: 0.55 };
}

/**
 * One voice in focus, the others waiting behind it in perspective. Nothing changes on its own: a quote should stay until
 * it has been read, so the visitor moves it on: by button, arrow key, throwing the card aside, or clicking a panel behind.
 */
export function TestimonialStack({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const wide = useWide();
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLUListElement>(null);
  const thrown = useRef(false);
  // The card in front follows the hand, leaning the way it is pulled.
  const pull = useMotionValue(0);
  const lean = useTransform(pull, [-240, 240], [7, -7]);

  const go = (delta: number) => setActive((i) => (i + delta + COUNT) % COUNT);

  // The model behind follows, its own frame stepping forward with the quote.
  useEffect(() => {
    sceneStore.pin = { form: "voices", step: active };
    sceneStore.invalidate?.();
    return () => {
      if (sceneStore.pin?.form === "voices") sceneStore.pin = null;
      sceneStore.invalidate?.();
    };
  }, [active]);

  // Tilt and light are written straight to the panel, since they change on every pointer move.
  const onPointerMove = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || reduced) return;
    const face = stageRef.current?.querySelector<HTMLElement>("[data-focus] .voice-face");
    if (!face) return;
    const box = face.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    face.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    face.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
    face.style.setProperty("--light-x", `${x * 100}%`);
    face.style.setProperty("--light-y", `${y * 100}%`);
    face.style.setProperty("--shift-x", (x - 0.5).toFixed(3));
    face.style.setProperty("--shift-y", (y - 0.5).toFixed(3));
    face.dataset.lit = "";
  };
  const onPointerLeave = () => {
    stageRef.current?.querySelectorAll<HTMLElement>(".voice-face").forEach((face) => {
      ["--tilt-x", "--tilt-y", "--shift-x", "--shift-y"].forEach((name) => face.style.removeProperty(name));
      delete face.dataset.lit;
    });
  };

  const controls = (
    <>
      <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="voice-control">
        <ArrowLeft aria-hidden="true" size={16} />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="voice-control">
        <ArrowRight aria-hidden="true" size={16} />
      </button>
      <ol className="m-0 ml-1 flex list-none items-center p-0">
        {testimonials.map((t, i) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show testimonial ${i + 1} of ${COUNT}`}
              aria-current={i === active ? "true" : undefined}
              className="voice-dot"
            >
              <span aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </>
  );

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="What clients say"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        else if (e.key === "ArrowRight") go(1);
        else return;
        e.preventDefault();
      }}
      className="voices relative"
    >
      <div aria-hidden="true" className="voices-light" style={{ "--active": active } as React.CSSProperties} />

      <header className="lg:text-center">{children}</header>

      <div data-reveal="rise" className="mt-10 lg:mt-12">
      <ul
        ref={stageRef}
        aria-live="polite"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="voices-stage m-0 grid list-none p-0"
      >
        {testimonials.map((t, i) => {
          // The shorter way round, so three panels always read as one in front and one to each side.
          const raw = (i - active + COUNT) % COUNT;
          const offset = raw > COUNT / 2 ? raw - COUNT : raw;
          const focused = offset === 0;
          return (
            <motion.li
              key={t.id}
              initial={false}
              animate={placeFor(offset, wide)}
              transition={reduced ? { duration: 0 } : SPRING}
              data-focus={focused ? "" : undefined}
              aria-hidden={!focused}
              onClick={() => {
                if (!focused && !thrown.current) setActive(i);
              }}
              className={`voice [grid-area:1/1] lg:justify-self-center ${focused ? "z-10" : "z-0 cursor-pointer"}`}
            >
              <motion.div
                className="voice-hold"
                data-cursor={focused && !reduced ? "drag" : undefined}
                drag={focused ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.32}
                dragTransition={{ bounceStiffness: 260, bounceDamping: 26 }}
                dragDirectionLock
                whileTap={focused && !reduced ? { scale: 0.985 } : undefined}
                style={focused ? { x: pull, rotateY: reduced ? 0 : lean } : undefined}
                onDragStart={() => {
                  thrown.current = true;
                  onPointerLeave();
                }}
                onDragEnd={(_, info: PanInfo) => {
                  const far = Math.abs(info.offset.x) > THROW.distance || Math.abs(info.velocity.x) > THROW.speed;
                  if (far) {
                    // The next card takes the front from rest, not from where this one was let go.
                    pull.jump(0);
                    go(info.offset.x < 0 ? 1 : -1);
                  }
                  // A click fires after the hand lets go; this keeps it from also choosing a card.
                  setTimeout(() => (thrown.current = false), 0);
                }}
              >
              <div className="voice-face">
                <div aria-hidden="true" className="voice-meta label">
                  <span>Voice {String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden="true" className="voice-meta-rule" />
                  <span>of {String(COUNT).padStart(2, "0")}</span>
                </div>

                <span aria-hidden="true" className="voice-quote">
                  <Quote size={30} fill="currentColor" strokeWidth={0} />
                  <Quote size={30} fill="currentColor" strokeWidth={0} />
                  <Quote size={30} fill="currentColor" strokeWidth={0} />
                </span>

                <motion.div
                  initial={false}
                  animate={focused ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0.3, y: 10, filter: "blur(3px)" }}
                  transition={reduced ? { duration: 0 } : { ...SPRING, delay: focused ? 0.12 : 0 }}
                  className="voice-words"
                >
                  <blockquote className="m-0 text-[clamp(1.1rem,1.65vw,1.5rem)] leading-[1.42] tracking-[-0.012em]">{t.quote}</blockquote>
                  <p className="voice-person border-line mt-6 border-t pt-4">
                    <span className="font-display block font-medium">{t.name}</span>
                    <span className="label mt-1 block">{t.role}</span>
                  </p>
                </motion.div>
              </div>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
      </div>

      <div className="mt-6 flex items-center gap-3 lg:mt-8 lg:justify-center">{controls}</div>
    </div>
  );
}
