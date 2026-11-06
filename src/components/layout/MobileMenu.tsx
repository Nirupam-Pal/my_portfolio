"use client";

import { useEffect, useRef, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { smooth } from "@/animations/scroll";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { navItems, profile, type NavId } from "@/data/profile";

const EXPO = [0.16, 1, 0.3, 1] as const;

interface MobileMenuProps {
  open: boolean;
  hrefFor: (id: NavId) => string;
  toggleRef: RefObject<HTMLButtonElement | null>;
  /** Closes and returns focus to the toggle. */
  onDismiss: () => void;
  /** Closes because a link was followed, so focus moves with the navigation instead. */
  onNavigate: () => void;
}

/** Loaded the first time it opens, so most visitors never download its animation library. */
export default function MobileMenu({ open, hrefFor, toggleRef, onDismiss, onNavigate }: MobileMenuProps) {
  const reduced = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);

  // Pause scrolling, make the page inert, and hold focus inside.
  useEffect(() => {
    if (!open) return;
    const main = document.querySelector("main");
    smooth.lenis?.stop();
    main?.setAttribute("inert", "");
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusable = [toggleRef.current, ...menuRef.current.querySelectorAll<HTMLElement>("a")].filter(Boolean) as HTMLElement[];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      smooth.lenis?.start();
    };
  }, [open, onDismiss, toggleRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          animate={reduced ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
          exit={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: reduced ? 0.1 : 0.7, ease: [0.65, 0, 0.35, 1] }}
          className="z-menu bg-ink-1 fixed inset-0 flex flex-col justify-between overflow-y-auto px-(--gutter) pt-24 pb-8 lg:hidden"
        >
          <ul className="flex flex-col">
            {navItems.map(({ id, label }, i) => (
              <li key={id} className="border-line overflow-hidden border-b">
                <motion.div
                  initial={reduced ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.16 + i * 0.055, ease: EXPO }}
                >
                  <TransitionLink
                    href={hrefFor(id)}
                    onClick={() => {
                      // Restart now: doing it when the menu unmounts would cancel the scroll this click begins.
                      smooth.lenis?.start();
                      onNavigate();
                    }}
                    className="display flex items-baseline justify-between py-3.5 text-[clamp(2.4rem,11.5vw,4.5rem)]"
                  >
                    {label}
                    <span aria-hidden="true" className="label">
                      0{i}
                    </span>
                  </TransitionLink>
                </motion.div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <a className="label text-paper text-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <a className="label text-paper text-link" href={profile.resume} download={profile.resumeFileName}>
              Resume
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
