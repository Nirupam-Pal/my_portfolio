"use client";

import type { ComponentProps, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { scrollToTarget } from "@/animations/scroll";
import { navigateWithTransition } from "@/components/layout/PageTransition";

interface TransitionLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  /** The line of type shown during the wipe. */
  transitionLabel?: string;
  children: ReactNode;
}

/** An in-site link: scrolls within the current page, or wipes to another page. */
export function TransitionLink({ href, transitionLabel = "Nirupam Pal", onClick, children, ...rest }: TransitionLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const [path, hash] = href.split("#");
    const targetPath = path || pathname;
    e.preventDefault();

    if (targetPath === pathname) {
      if (hash) {
        scrollToTarget(`#${hash}`);
        history.replaceState(null, "", `#${hash}`);
      } else {
        scrollToTarget(0);
      }
      return;
    }
    navigateWithTransition(href, transitionLabel);
  };

  return (
    <Link href={href} onClick={handleClick} scroll={false} {...rest}>
      {children}
    </Link>
  );
}
