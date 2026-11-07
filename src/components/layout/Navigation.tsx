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
  const [active, setActive] = useState<NavId | null>("home");
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
          // Sections without a nav entry clear the indicator rather than leave it on the wrong item.
          setActive(ids.has(entry.target.id) ? (entry.target.id as NavId) : null);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  // The scrim only appears once there is content to pass beneath the nav.
  useEffect(() => {
    const onScroll = () => headerRef.current?.setAttribute("data-scrolled", String(window.scrollY > 48));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // One rule slides between items, measured only when the active item changes.
  useEffect(() => {
    const place = () => {
      const list = listRef.current;
      const bar = indicatorRef.current;
      if (!list || !bar) return;
      const item = list.querySelector('[aria-current="true"]');
      if (!item) {
        bar.style.opacity = "0";
        return;
      }
      const inset = 14;
      const box = item.getBoundingClientRect();
      bar.style.opacity = "1";
      bar.style.transform = `translateX(${box.left - list.getBoundingClientRect().left + inset}px) scaleX(${box.width - inset * 2})`;
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
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
              className="font-display flex h-11 items-center gap-3 text-[0.95rem] font-medium tracking-[-0.01em]"
            >
              <span aria-hidden="true" className="border-line-strong flex h-9 w-9 items-center justify-center border text-[0.8rem]">
                NP
              </span>
              <span className="hidden sm:inline lg:hidden xl:inline">Nirupam Pal</span>
            </TransitionLink>
          </Magnetic>

          <nav aria-label="Primary" className="pointer-events-auto relative hidden lg:block">
            <ul ref={listRef} className="border-line bg-ink-0/70 flex items-center border px-2 backdrop-blur-md">
              {navItems.map(({ id, label }) => {
                const isActive = isHome && active === id;
                return (
                  <li key={id}>
                    <Magnetic strength={0.18}>
                      <TransitionLink
                        href={hrefFor(id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`relative block px-3.5 py-3 font-mono text-[0.7rem] font-medium tracking-[0.13em] uppercase transition-colors duration-300 ${
                          isActive ? "text-paper" : "text-mute hover:text-paper"
                        }`}
                      >
                        {label}
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
            className="label text-paper pointer-events-auto hidden h-11 items-center lg:flex"
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
            className="label text-paper border-line bg-ink-0/70 pointer-events-auto z-10 flex h-11 items-center border px-4 backdrop-blur-md lg:hidden"
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
