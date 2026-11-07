import { ArrowDown, ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { profile } from "@/data/profile";

import { HeroModel, HeroModelCaption } from "./HeroModel";

/** A still drawing of the laptop and what it connects to, shown only when WebGL is unavailable. */
function SystemDrawing() {
  const links = ["M160 120V200", "M250 260H300", "M160 320V390", "M70 260H40"];
  return (
    <svg viewBox="0 0 340 480" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" role="presentation">
      <g opacity="0.75">
        <path d="M60 30h130v90H60z M78 54h94 M78 72h60" />
        <path d="M205 58h95v62h-95z" opacity="0.6" />
      </g>
      <path d="M90 205h140a6 6 0 0 1 6 6v84H84v-84a6 6 0 0 1 6-6z" />
      <path d="M62 295h196l14 18H48z" />
      <g stroke="var(--color-sky)">
        <path d="M100 224h46 M100 240h22 M130 240h58 M100 256h78 M100 272h36" />
      </g>
      <path d="M270 300h52v32h-52z M285 225h40v26h-40z M296 251v49" opacity="0.8" />
      <ellipse cx="160" cy="400" rx="58" ry="12" />
      <path d="M102 400v42c0 7 26 12 58 12s58-5 58-12v-42 M102 421c0 7 26 12 58 12s58-5 58-12" />
      <g stroke="var(--color-sky)" strokeDasharray="2 6">
        {links.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** What is being learned, kept apart from the job title above it. Leads to the section that says more. */
function ExploringBadge() {
  const links = ["M3 3L10 7", "M3 8L10 7", "M3 13L10 7", "M3 3L10 12", "M3 13L10 12", "M10 7L17 8", "M10 12L17 8"];
  const nodes = [[3, 3], [3, 8], [3, 13], [10, 7], [10, 12], [17, 8]];
  return (
    <TransitionLink href="#ai" className="exploring" aria-label="Exploring AI and ML: learning, experimenting and building. Go to the AI and ML section">
      <svg aria-hidden="true" viewBox="0 0 20 16" className="exploring-net" fill="none">
        {links.map((d, i) => (
          <path key={d} d={d} style={{ "--i": i } as React.CSSProperties} />
        ))}
        {nodes.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.25" />
        ))}
      </svg>
      <span>Exploring AI &amp; ML</span>
      <span className="exploring-more">
        <span>Learning, experimenting &amp; building.</span>
      </span>
    </TransitionLink>
  );
}

export function Hero() {
  return (
    <section id="home" data-hero aria-labelledby="hero-title" className="relative h-[165svh]">
      {/* Scroll anchors for the camera: looking at the laptop at the top, close on its screen by the end. */}
      <div data-pose="hero" className="absolute inset-x-0 top-0 h-svh" />
      <div data-pose="through" className="absolute inset-x-0 -bottom-[8svh] h-px" />

      {/* The name is set clear of the sculpture, which sits to the right of it and below its first line. */}
      <div className="z-hero-name sticky top-0 h-svh overflow-hidden">
        <div data-hero-name className="absolute inset-x-0 px-(--gutter) will-change-transform">
          <h1 id="hero-title" className="display hero-name leading-[0.8]">
            <Split text={"Nirupam\nPal."} hero />
          </h1>
        </div>
      </div>

      <div className="webgl-fallback text-mute pointer-events-none absolute top-[34svh] right-(--gutter) h-[60svh] w-[40vw] max-w-xl opacity-70 max-lg:top-[26svh] max-lg:w-[70vw] max-lg:opacity-30">
        <SystemDrawing />
      </div>

      {/* Copy sits above the canvas and stays fully interactive. */}
      <div className="z-content pointer-events-none sticky top-0 -mt-[100svh] h-svh">
        <div data-hero-copy className="from-ink-0/95 via-ink-0/75 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-(--gutter) pt-20 pb-8 sm:pb-10 lg:bg-none lg:pt-0 xl:pb-14">
          <div className="hero-fade pointer-events-auto mb-5 flex flex-wrap items-center gap-x-8 gap-y-2" style={{ "--d": "650ms" } as React.CSSProperties}>
            <p className="label text-paper flex items-center gap-2.5">
              <span aria-hidden="true" className="availability-dot bg-sky h-1.5 w-1.5" />
              Available for opportunities
            </p>
            <ExploringBadge />
            <HeroModelCaption />
          </div>
          <div className="hero-fade pointer-events-auto max-w-[44rem]" style={{ "--d": "800ms" } as React.CSSProperties}>
            <p className="font-display text-[clamp(1.2rem,1.7vw,1.9rem)] leading-[1.08] font-medium tracking-[-0.025em] uppercase">
              Software Engineer &amp; Creative Developer
            </p>
            <p className="hero-statement text-mute mt-3.5 max-w-[58ch] text-[0.95rem] leading-relaxed sm:text-base">{profile.statement}</p>
          </div>
          <div className="hero-fade pointer-events-auto mt-6 flex flex-wrap items-center gap-3" style={{ "--d": "950ms" } as React.CSSProperties}>
            <Magnetic>
              <TransitionLink href="#work" className="btn btn-primary">
                Explore My Work
                <ArrowDown aria-hidden="true" size={15} />
              </TransitionLink>
            </Magnetic>
            <ButtonLink
              href={profile.resume}
              download={profile.resumeFileName}
              variant="line"
              icon={<ArrowUpRight aria-hidden="true" size={15} />}
              ariaLabel="Download resume as a PDF"
            >
              Download Resume
            </ButtonLink>
            <ScrollHint />
          </div>
        </div>
      </div>

      <HeroModel />
    </section>
  );
}
