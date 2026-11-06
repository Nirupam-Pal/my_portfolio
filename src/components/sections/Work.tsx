import Image from "next/image";
import { ArrowRight, ArrowUpRight, Award } from "lucide-react";

import { GithubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { SheetLabel } from "@/components/ui/SheetLabel";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { projects, type Project } from "@/data/projects";

import { ModelSteps, StepHost } from "./ModelSteps";
import { ProjectLegend } from "./ProjectLegend";
import { WorkExhibition } from "./WorkExhibition";

/** One design system, three compositions: each project is staged the way that product behaves. */
const LAYOUT = {
  flagship: {
    copy: "lg:col-span-6 xl:col-span-5",
    stage: "lg:col-span-6 lg:col-start-7 xl:col-span-7 xl:col-start-6",
    capture: "lg:right-0 lg:bottom-[5%] lg:w-[46%]",
    title: "display text-[length:var(--fs-title)]",
    scrim: "linear-gradient(90deg, transparent 0, rgb(8 9 13 / 0.86) 9%, rgb(8 9 13 / 0.7) 44%, transparent 68%)",
    meta: "lg:right-0 lg:text-right",
    steps: "lg:top-[24%] lg:right-0 lg:items-end",
  },
  // A network of people reads across: profile capture first, then the person's words.
  mirror: {
    copy: "lg:col-span-5 lg:col-start-8 lg:row-start-1",
    stage: "lg:col-span-7 lg:col-start-1 lg:row-start-1",
    capture: "lg:left-0 lg:bottom-[5%] lg:w-[50%]",
    title: "display text-[length:var(--fs-title)]",
    scrim: "linear-gradient(270deg, transparent 0, rgb(8 9 13 / 0.86) 6%, rgb(8 9 13 / 0.7) 40%, transparent 62%)",
    meta: "lg:left-0",
    steps: "lg:top-[10%] lg:left-0",
  },
  // Travel is editorial: lighter type in sentence case, led by the photographs.
  editorial: {
    copy: "lg:col-span-5",
    stage: "lg:col-span-7 lg:col-start-6",
    capture: "",
    title: "font-display text-[clamp(3.2rem,8.6vw,9.5rem)] leading-[0.95] font-light tracking-[-0.05em]",
    scrim: "linear-gradient(90deg, transparent 0, rgb(8 9 13 / 0.9) 7%, rgb(8 9 13 / 0.78) 36%, transparent 52%)",
    meta: "lg:right-0 lg:text-right",
    steps: "lg:top-[10%] lg:right-0 lg:items-end",
  },
} as const;

function Captures({ project }: { project: Project }) {
  if (project.captures.length > 1) {
    // Wanderlust: real listing photographs. Each one lights up with the house in the model that was built from it.
    return (
      <StepHost form={project.id} className="pointer-events-none grid grid-cols-3 gap-2 lg:absolute lg:right-0 lg:bottom-[5%] lg:w-[62%]">
        {project.captures.map((capture, i) => (
          <figure key={capture.src} data-step-item data-depth={3 + i * 2} className="listing-photo pointer-events-auto">
            <div data-reveal="clip" className="capture-frame">
              <Image src={capture.src} alt={capture.alt} width={capture.width} height={capture.height} sizes="(min-width: 1024px) 14vw, 32vw" className="h-auto w-full scale-[1.06]" />
            </div>
          </figure>
        ))}
      </StepHost>
    );
  }
  const capture = project.captures[0];
  return (
    <figure data-depth="5" className={`pointer-events-none lg:absolute ${LAYOUT[project.layout].capture}`}>
      <div data-reveal="clip" className="capture-frame">
        <Image src={capture.src} alt={capture.alt} width={capture.width} height={capture.height} sizes="(min-width: 1024px) 28vw, 90vw" className="h-auto w-full" />
      </div>
    </figure>
  );
}

function ProjectPanel({ project }: { project: Project }) {
  const external = !project.caseStudy;
  const layout = LAYOUT[project.layout];
  return (
    <article
      data-panel
      data-pose={project.id}
      aria-labelledby={`${project.id}-title`}
      className="relative lg:grid lg:min-h-svh lg:w-screen lg:shrink-0 lg:grid-cols-12 lg:gap-x-6 lg:px-(--gutter) lg:pt-22 lg:pb-12"
      style={{ "--accent": project.accent } as React.CSSProperties}
    >
      {/* Keeps copy readable however the model behind it is lit, feathered so no edge shows between panels. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" style={{ background: layout.scrim }} />

      {/* On small screens the top of each panel is left open, so the fixed 3D model shows through. */}
      <div className={`relative px-(--gutter) pt-[52svh] lg:flex lg:flex-col lg:justify-center lg:px-0 lg:pt-0 ${layout.copy}`}>
        <div className="from-ink-0/0 via-ink-0/75 to-ink-0/75 -mx-(--gutter) bg-gradient-to-b px-(--gutter) pt-10 lg:mx-0 lg:bg-none lg:px-0 lg:pt-0">
          <p data-reveal="rise" className="label mb-3 flex items-center gap-3">
            <span style={{ color: project.accent }}>Project {project.number}</span>
            <span aria-hidden="true" className="bg-line-strong h-px w-8" />
            <span>of 03</span>
          </p>
          <h3
            id={`${project.id}-title`}
            data-reveal={project.layout === "editorial" ? "rise" : "chars"}
            className={`w-max max-w-none ${layout.title}`}
          >
            {project.layout === "editorial" ? project.title : <Split text={project.title} />}
          </h3>

          {project.achievements && (
            <ul data-reveal="rise" className="mt-5 flex flex-col gap-1.5">
              {project.achievements.map((a) => (
                <li key={a} className="text-gold flex items-center gap-2 font-mono text-[0.72rem] font-medium tracking-[0.05em] uppercase">
                  <Award aria-hidden="true" size={14} className="shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          )}

          <p data-reveal="rise" className="mt-5 max-w-[38rem] text-[1.0625rem] leading-relaxed lg:text-[clamp(1rem,1.25vw,1.2rem)]">
            {project.description}
          </p>

          <ul data-reveal="rise" className="text-mute xs:grid-cols-2 mt-5 grid max-w-[38rem] grid-cols-1 gap-x-6 gap-y-1 text-[0.875rem]">
            {project.features.map((f) => (
              <li key={f} className="flex gap-2.5 leading-snug">
                <span aria-hidden="true" className="mt-[0.6em] h-px w-2.5 shrink-0" style={{ background: project.accent }} />
                {f}
              </li>
            ))}
          </ul>

          <p data-reveal="rise" className="text-paper/85 mt-5 font-mono text-[0.72rem] leading-relaxed tracking-[0.04em]">
            <span className="sr-only">Built with: </span>
            {project.stack.join("  /  ")}
          </p>

          <div data-reveal="rise" className="mt-6 flex flex-wrap gap-2.5">
            <ButtonLink
              href={project.live}
              external
              accent={project.accent}
              hoverInk="#08090d"
              icon={<ArrowUpRight aria-hidden="true" size={15} />}
              ariaLabel={`Open the live ${project.title} website (opens in a new tab)`}
            >
              Live Site
            </ButtonLink>
            {project.caseStudy && (
              <Magnetic>
                <TransitionLink href={project.caseStudy} transitionLabel={project.title} className="btn btn-line">
                  Case Study
                  <ArrowRight aria-hidden="true" size={15} />
                </TransitionLink>
              </Magnetic>
            )}
            <ButtonLink
              href={project.repo}
              external
              variant="line"
              icon={<GithubIcon size={15} />}
              ariaLabel={`${project.title} source code on GitHub (opens in a new tab)`}
            >
              Code
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* The rest of the panel looks through to the model; the whole area opens the project. */}
      <div className={`relative mt-8 px-(--gutter) pb-16 lg:mt-0 lg:px-0 lg:pb-0 ${layout.stage}`}>
        {external ? (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="view"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 hidden lg:block"
          />
        ) : (
          <TransitionLink
            href={project.caseStudy!}
            transitionLabel={project.title}
            data-cursor="view"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 hidden lg:block"
          >
            <span />
          </TransitionLink>
        )}
        {project.legend && <ProjectLegend items={project.legend} accent={project.accent} />}
        <ModelSteps form={project.id} title={project.flow.title} steps={project.flow.steps} accent={project.accent} className={layout.steps} />
        <p className={`label mb-3 text-[0.64rem] lg:absolute lg:top-[4%] lg:mb-0 ${layout.meta}`}>{project.conceptNote}</p>
        <Captures project={project} />
        <p className={`label mt-2 text-[0.64rem] lg:absolute lg:bottom-0 lg:mt-0 ${layout.meta}`}>Live capture: {project.liveLabel}</p>
      </div>
    </article>
  );
}

/** Screens from inside the app, sized so all four fit on one panel at any desktop height. */
function GalleryPanel({ project }: { project: Project }) {
  return (
    <section
      data-panel
      data-pose={project.id}
      aria-labelledby={`${project.id}-gallery-title`}
      className="bg-ink-0/80 relative px-(--gutter) py-14 lg:flex lg:h-svh lg:w-screen lg:shrink-0 lg:flex-col lg:justify-center lg:bg-ink-0/70 lg:pt-20 lg:pb-12"
    >
      <p data-reveal="rise" className="label mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span style={{ color: project.accent }}>{project.title}</span>
        <span aria-hidden="true" className="bg-line-strong h-px w-8" />
        <span>Signed in</span>
        <span aria-hidden="true" className="bg-line-strong hidden h-px w-8 sm:block" />
        <span>Other members blurred for privacy</span>
      </p>
      <h4 id={`${project.id}-gallery-title`} data-reveal="rise" className="font-display mb-5 text-[clamp(1.5rem,2.4vw,2.25rem)] font-medium tracking-[-0.025em]">
        Inside the app
      </h4>
      <ul className="gallery-grid m-0 grid list-none gap-x-5 gap-y-4 p-0 sm:grid-cols-2">
        {project.gallery?.map((shot) => (
          <li key={shot.src}>
            <figure>
              <div data-reveal="clip" className="capture-frame aspect-2/1">
                <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(min-width: 640px) 46vw, 92vw" className="h-full w-full object-cover object-top" />
              </div>
              <figcaption className="label mt-2 text-[0.64rem]">{shot.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The flagship gets a plate of its own before its details: the name, at full scale, inside its network. */
function FlagshipPlate({ project }: { project: Project }) {
  return (
    <div
      aria-hidden="true"
      data-panel
      data-pose="bloodlink-open"
      className="exhibit-only relative h-svh w-screen shrink-0 flex-col justify-between px-(--gutter) pt-28 pb-12"
    >
      <p className="label flex items-center gap-3">
        <span style={{ color: project.accent }}>Project {project.number}</span>
        <span className="bg-line-strong h-px w-8" />
        <span>The flagship</span>
      </p>
      <p className="display text-[min(18.5vw,44svh)] leading-[0.8]">{project.title}</p>
      <div className="flex items-end justify-between gap-8">
        <ul className="flex flex-col gap-1.5">
          {project.achievements?.map((a) => (
            <li key={a} className="text-gold flex items-center gap-2 font-mono text-[0.72rem] font-medium tracking-[0.05em] uppercase">
              <Award size={14} className="shrink-0" />
              {a}
            </li>
          ))}
        </ul>
        <p className="label text-right">Continue to the build &rarr;</p>
      </div>
    </div>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="z-content relative">
      <WorkExhibition>
        <div
          data-panel
          data-pose="work-intro"
          className="flex min-h-[70svh] flex-col justify-center px-(--gutter) pt-28 lg:h-svh lg:w-[78vw] lg:shrink-0 lg:pt-0"
        >
          <SheetLabel sheet="02" title="The Main Showcase" className="mb-8" />
          <h2 id="work-title" data-reveal="chars" className="display heading-section">
            <Split text={"Selected\nWork."} />
          </h2>
          <p data-reveal="rise" className="text-mute mt-8 max-w-md leading-relaxed">
            Three products, each shown twice: as a real capture of the live app, and as the same steel from the opening
            sculpture, rebuilt into a model of how that product works.
          </p>
        </div>
        {projects.map((project) => (
          <div key={project.id} className="contents">
            {project.layout === "flagship" && <FlagshipPlate project={project} />}
            <ProjectPanel project={project} />
            {project.gallery && <GalleryPanel project={project} />}
          </div>
        ))}
      </WorkExhibition>
    </section>
  );
}
