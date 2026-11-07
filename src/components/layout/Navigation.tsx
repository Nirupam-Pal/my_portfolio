"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { Magnetic } from "@/components/ui/Magnetic";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { navItems, profile, type NavId } from "@/data/profile";

const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });

export function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [active, setActive] = useState<NavId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRequested, setMenuRequested] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Active section: whichever section crosses the middle of the screen.
  useEffect(() => {
    if (!isHome) return;
    const ids = new Set<string>(navItems.map((n) => n.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // A section can belong to another's nav entry; the rest without one clear the indicator rather than leave it on the wrong item.
          const id = (entry.target as HTMLElement).dataset.navParent ?? entry.target.id;
          setActive(ids.has(id) ? (id as NavId) : null);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  // Leaving the top, the nav docks: the scrim comes in, the name falls away letter by letter, the logo redraws inside a
  // turning frame, a light passes along the pill and its items settle one after another. At the top it all comes back.
  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current;
      if (!header) return;
      const scrolled = String(window.scrollY > 48);
      const was = header.getAttribute("data-scrolled");
      // Undocking only animates after a dock has happened, never on arrival.
      if (was && was !== scrolled) header.setAttribute("data-nav-moved", "");
      header.setAttribute("data-scrolled", scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // One rule slides between items, measured only when the active item changes.
  useEffect(() => {
    const place = (target?: Element | null) => {
      const list = listRef.current;
      const bar = indicatorRef.current;
      if (!list || !bar) return;
      const item = target ?? list.querySelector('[aria-current="true"]');
      if (!item) {
        bar.style.opacity = "0";
        return;
      }
      const inset = 14;
      const box = item.getBoundingClientRect();
      bar.style.opacity = "1";
      bar.style.transform = `translateX(${box.left - list.getBoundingClientRect().left + inset}px) scaleX(${box.width - inset * 2})`;
    };
    const home = () => place();
    const point = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const link = (e.target as Element).closest("a");
      if (link) place(link);
    };
    const list = listRef.current;
    home();
    window.addEventListener("resize", home);
    list?.addEventListener("pointerover", point);
    list?.addEventListener("pointerleave", home);
    document.fonts?.ready.then(home);
    return () => {
      window.removeEventListener("resize", home);
      list?.removeEventListener("pointerover", point);
      list?.removeEventListener("pointerleave", home);
    };
  }, [active, isHome]);

  const dismissMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);
  const followMenuLink = useCallback(() => setMenuOpen(false), []);

  const hrefFor = useCallback((id: NavId) => (isHome ? `#${id}` : `/#${id}`), [isHome]);

  return (
    <>
      <header ref={headerRef} className="z-chrome pointer-events-none fixed inset-x-0 top-0">
        <div aria-hidden="true" className="nav-scrim absolute inset-x-0 top-0 h-28" />
        <div className="relative flex items-start justify-between px-(--gutter) pt-5">
          <Magnetic className="pointer-events-auto">
            <TransitionLink
              href={isHome ? "#home" : "/"}
              aria-label="Nirupam Pal, back to the top"
              className="font-display flex h-11 items-center text-[0.95rem] font-medium tracking-[-0.01em]"
            >
              {/* The site's tab icon, drawn inline so its N can write itself in. */}
              <span aria-hidden="true" className="nav-mark relative flex h-9 w-9 items-center justify-center">
                <svg viewBox="0 0 32 32" className="h-full w-full">
                  <rect width="32" height="32" fill="#08090D" />
                  <path className="nav-logo-n" d="M8 25V7l16 18V7" fill="none" stroke="#F5F5F7" strokeWidth="2.4" pathLength={1} />
                  <path className="nav-logo-line" d="M4 28h24" stroke="#8B5CF6" strokeWidth="1.6" />
                </svg>
              </span>
              <span aria-hidden="true" className="nav-wordmark hidden pl-3 sm:inline-flex">
                {[..."Nirupam Pal"].map((ch, i) => (
                  <span key={i} className="nav-letter" style={{ "--i": i } as React.CSSProperties}>
                    {ch === " " ? "\u00a0" : ch}
                  </span>
                ))}
              </span>
            </TransitionLink>
          </Magnetic>

          <nav aria-label="Primary" className="pointer-events-auto relative hidden lg:block">
            <ul ref={listRef} className="nav-pill border-line bg-ink-0/70 flex items-center border px-2 backdrop-blur-md">
              {navItems.map(({ id, label }, i) => {
                const isActive = isHome && active === id;
                return (
                  <li key={id} style={{ "--i": i } as React.CSSProperties}>
                    <Magnetic strength={0.18}>
                      <TransitionLink
                        href={hrefFor(id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`relative block px-3.5 py-3 font-mono text-[0.7rem] font-medium tracking-[0.13em] uppercase transition-colors duration-300 ${
                          isActive ? "text-paper" : "text-mute hover:text-paper"
                        }`}
                      >
                        {/* On hover the label rolls up and a copy rolls in beneath it. */}
                        <span className="nav-roll">
                          <span>{label}</span>
                          <span aria-hidden="true">{label}</span>
                        </span>
                      </TransitionLink>
                    </Magnetic>
                  </li>
                );
              })}
            </ul>
            <span ref={indicatorRef} aria-hidden="true" className="nav-indicator bg-sky absolute bottom-1.5 left-0 h-px" />
          </nav>

          <a
            href={profile.resume}
            download={profile.resumeFileName}
            className="nav-resume label text-paper pointer-events-auto hidden h-11 items-center lg:flex"
          >
            <span className="text-link">Resume</span>
          </a>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => {
              setMenuRequested(true);
              setMenuOpen((v) => !v);
            }}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="nav-toggle label text-paper border-line bg-ink-0/70 pointer-events-auto z-10 flex h-11 items-center border px-4 backdrop-blur-md lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {menuRequested && (
        <MobileMenu open={menuOpen} hrefFor={hrefFor} toggleRef={toggleRef} onDismiss={dismissMenu} onNavigate={followMenuLink} />
      )}
    </>
  );
}
