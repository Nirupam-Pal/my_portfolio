import { ArrowDown, ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { profile } from "@/data/profile";

import { HeroModel, HeroModelCaption } from "./HeroModel";

/** Static elevation of the tower, shown only when WebGL is unavailable. */
function TowerDrawing() {
  const floors = Array.from({ length: 15 }, (_, i) => {
    const f = i / 14;
    const twist = f * 1.25;
    const w = 1.12 + 0.42 * Math.sin(f * Math.PI * 1.3 + 0.5);
    const y = 490 - f * 460;
    const dx = Math.cos(twist) * w * 62;
    const skew = Math.sin(twist) * w * 16;
    return { cx: 160 + 12 * Math.sin(f * 6), y, dx, skew };
  });
  return (
    <svg viewBox="0 0 320 520" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1" role="presentation">
      {floors.map((p, i) => {
        const prev = floors[i - 1];
        return (
          <g key={p.y} opacity={0.35 + (i / 14) * 0.55}>
            <path d={`M${p.cx - p.dx} ${p.y - p.skew}L${p.cx + p.dx} ${p.y + p.skew}L${p.cx + p.dx * 0.7} ${p.y - p.skew - 8}L${p.cx - p.dx * 0.7} ${p.y - p.skew * 2 - 8}Z`} />
            {prev && <path d={`M${prev.cx - prev.dx} ${prev.y - prev.skew}L${p.cx - p.dx} ${p.y - p.skew}M${prev.cx + prev.dx} ${prev.y + prev.skew}L${p.cx + p.dx} ${p.y + p.skew}`} />}
          </g>
        );
      })}
      <path d="M160 10V510" stroke="var(--color-sky)" strokeDasharray="2 6" />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="home" data-hero aria-labelledby="hero-title" className="relative h-[165svh]">
      {/* Scroll anchors for the camera: outside the tower at the top, inside it by the end. */}
      <div data-pose="hero" className="absolute inset-x-0 top-0 h-svh" />
      <div data-pose="through" className="absolute inset-x-0 -bottom-[8svh] h-px" />

      {/* On large screens the name sits beneath the canvas, with the sculpture standing in front of the type. */}
      <div className="z-hero-name sticky top-0 h-svh overflow-hidden">
        <div data-hero-name className="absolute inset-x-0 top-[max(5.75rem,12svh)] px-(--gutter) will-change-transform">
          <h1 id="hero-title" className="display text-[length:var(--fs-hero)] leading-[0.8]">
            <Split text={"Nirupam\nPal."} hero />
          </h1>
        </div>
      </div>

      <div className="webgl-fallback text-mute pointer-events-none absolute top-[10svh] right-(--gutter) h-[78svh] w-[46vw] max-w-xl opacity-70">
        <TowerDrawing />
      </div>

      {/* Copy sits above the canvas and stays fully interactive. */}
      <div className="z-content pointer-events-none sticky top-0 -mt-[100svh] h-svh">
        <div data-hero-copy className="from-ink-0/95 via-ink-0/75 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-(--gutter) pt-20 pb-8 sm:pb-10 lg:bg-none lg:pt-0 xl:pb-14">
          <div className="hero-fade pointer-events-auto mb-5 flex flex-wrap items-center gap-x-8 gap-y-2" style={{ "--d": "650ms" } as React.CSSProperties}>
            <p className="label text-paper flex items-center gap-2.5">
              <span aria-hidden="true" className="availability-dot bg-sky h-1.5 w-1.5" />
              Available for opportunities
            </p>
            <HeroModelCaption />
          </div>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="hero-fade pointer-events-auto lg:col-span-7" style={{ "--d": "800ms" } as React.CSSProperties}>
              <p className="font-display text-[clamp(1.2rem,1.85vw,2rem)] leading-[1.08] font-medium tracking-[-0.025em] uppercase">
                Full-Stack Developer
                <br />
                Building Digital Experiences That Matter.
              </p>
              <p className="text-mute mt-3.5 max-w-[46ch] text-[0.95rem] leading-relaxed sm:text-base">{profile.statement}</p>
            </div>
            <div className="hero-fade pointer-events-auto flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end" style={{ "--d": "950ms" } as React.CSSProperties}>
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
      </div>

      <HeroModel />
    </section>
  );
}
