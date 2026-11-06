import type { CSSProperties, ReactNode } from "react";

import { Magnetic } from "./Magnetic";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "line";
  external?: boolean;
  download?: string;
  icon?: ReactNode;
  ariaLabel?: string;
  /** Hover fill for the primary variant. */
  accent?: string;
  hoverInk?: string;
  cursor?: "view" | "link";
}

/** A plain anchor, so it keeps working before hydration and without JavaScript. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external,
  download,
  icon,
  ariaLabel,
  accent,
  hoverInk,
  cursor,
}: ButtonLinkProps) {
  const style = {
    ...(accent ? { "--accent": accent } : null),
    ...(hoverInk ? { "--btn-hover-ink": hoverInk } : null),
  } as CSSProperties;
  return (
    <Magnetic>
      <a
        href={href}
        className={`btn ${variant === "primary" ? "btn-primary" : "btn-line"}`}
        style={style}
        data-cursor={cursor}
        download={download}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      >
        {children}
        {icon}
      </a>
    </Magnetic>
  );
}
