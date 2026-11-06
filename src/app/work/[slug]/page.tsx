import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Award } from "lucide-react";

import { GithubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { caseStudies, type CaseStudyScreen } from "@/data/caseStudies";
import { projects } from "@/data/projects";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) return {};
  return {
    title: `${project.title} Case Study`,
    description: project.description,
    alternates: { canonical: project.caseStudy },
    openGraph: { title: `${project.title} Case Study | Nirupam Pal`, description: project.description, url: project.caseStudy },
  };
}

/** Tall captures take a narrower column, so a whole screen stays in view while its text is read. */
function ScreenRow({ screen, flip, accent }: { screen: CaseStudyScreen; flip: boolean; accent: string }) {
  const tall = screen.height > screen.width;
  return (
    <figure className="grid items-center gap-x-10 gap-y-5 lg:grid-cols-12">
      <div className={`${tall ? "lg:col-span-5" : "lg:col-span-8"} ${flip ? `lg:order-2 ${tall ? "lg:col-start-8" : "lg:col-start-5"}` : ""}`}>
        <div data-reveal="clip" className="capture-frame">
          <Image
            src={screen.src}
            alt={screen.alt}
            width={screen.width}
            height={screen.height}
            sizes={tall ? "(min-width: 1024px) 40vw, 92vw" : "(min-width: 1024px) 64vw, 92vw"}
            className="h-auto w-full"
          />
        </div>
      </div>
      <figcaption className={`bg-ink-0/55 ${tall ? "lg:col-span-6" : "lg:col-span-4"} ${flip ? "lg:order-1" : ""} ${tall && !flip ? "lg:col-start-7" : ""}`}>
        <span aria-hidden="true" data-reveal="rule" className="mb-5 block h-px w-10 origin-left" style={{ background: accent }} />
        <h3 data-reveal="rise" className="font-display text-[clamp(1.5rem,2.4vw,2.25rem)] font-medium tracking-[-0.025em]">
          {screen.title}
        </h3>
        <p data-reveal="rise" className="text-mute mt-3 max-w-[34rem] leading-relaxed">
          {screen.body}
        </p>
      </figcaption>
    </figure>
  );
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.id === slug);
  if (index < 0) notFound();
  const project = projects[index];
  const study = caseStudies[project.id];
  const next = projects[(index + 1) % projects.length];

  return (
    <article
      data-pose={project.id}
      style={{ "--accent": project.accent } as React.CSSProperties}
      className="z-content relative px-(--gutter) pt-28 pb-20"
    >
      <Magnetic strength={0.2}>
        <TransitionLink href="/#work" transitionLabel="Selected Work" className="label text-paper flex min-h-11 items-center gap-2">
          <ArrowLeft aria-hidden="true" size={14} /> Selected Work
        </TransitionLink>
      </Magnetic>

      <header className="flex min-h-[calc(100svh-11rem)] flex-col justify-end pb-10">
        <p className="label hero-fade mb-5" style={{ "--d": "200ms", color: project.accent } as React.CSSProperties}>
          Case Study / Project {project.number}
        </p>
        {/* Above the fold, so it enters with CSS instead of waiting for hydration, like the home page's name. */}
        <h1 className="display text-[clamp(3.4rem,14vw,16rem)]">
          <Split text={project.title} hero />
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <p className="body-lead hero-fade max-w-[38rem] lg:col-span-6" style={{ "--d": "450ms" } as React.CSSProperties}>{project.description}</p>
          <div data-reveal="rise" className="flex flex-wrap items-start gap-2.5 lg:col-span-6 lg:justify-end">
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
      </header>

      {project.achievements && (
        <section aria-label="Recognition" className="border-line grid gap-px border-y py-8 md:grid-cols-2">
          {project.achievements.map((a) => (
            <p key={a} data-reveal="rise" className="text-gold font-display flex items-center gap-3 py-2 text-[clamp(1.25rem,2vw,1.875rem)] tracking-[-0.02em]">
              <Award aria-hidden="true" size={20} className="shrink-0" />
              {a}
            </p>
          ))}
        </section>
      )}

      <figure className="mt-20 lg:mt-32">
        <div data-reveal="clip" className="capture-frame">
          <div data-parallax="3">
            <Image
              src={study.hero.src}
              alt={study.hero.alt}
              width={study.hero.width}
              height={study.hero.height}
              sizes="94vw"
              className="h-auto w-full scale-[1.08]"
            />
          </div>
        </div>
        <figcaption className="label mt-3 text-[0.64rem]">{study.hero.caption}</figcaption>
      </figure>

      <section aria-labelledby="overview-title" className="mt-24 lg:mt-40">
        <h2 id="overview-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={study.overview.heading} by="words" />
        </h2>
        <div className="bg-ink-0/55 mt-10 grid max-w-[72rem] gap-x-10 gap-y-5 lg:grid-cols-2">
          {study.overview.paragraphs.map((paragraph) => (
            <p key={paragraph} data-reveal="rise" className="leading-relaxed lg:text-[1.0625rem]">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="flow-title" className="mt-24 lg:mt-40">
        <h2 id="flow-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={study.flow.heading} by="words" />
        </h2>
        <ol data-reveal="stagger" className={`mt-10 grid list-none gap-px p-0 sm:grid-cols-2 ${study.flow.steps.length > 4 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          {study.flow.steps.map((step, i) => (
            <li key={step} className="border-line bg-ink-0/55 border-t py-5 pr-6">
              <span className="label" style={{ color: project.accent }}>0{i + 1}</span>
              <p className="font-display mt-3 text-[1.375rem] font-medium tracking-[-0.02em]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="screens-title" className="mt-24 lg:mt-40">
        <h2 id="screens-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={study.screens.heading} by="words" />
        </h2>
        {study.screens.note && <p data-reveal="rise" className="label mt-5 text-[0.64rem]">{study.screens.note}</p>}
        <div className="mt-12 flex flex-col gap-16 lg:gap-28">
          {study.screens.items.map((screen, i) => (
            <ScreenRow key={screen.src} screen={screen} flip={i % 2 === 1} accent={project.accent} />
          ))}
        </div>
      </section>

      <section aria-labelledby="systems-title" className="mt-24 lg:mt-40">
        <h2 id="systems-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={"Inside the\nsystem."} by="words" />
        </h2>
        <dl className="mt-10 max-w-[64rem]">
          {study.systems.map((s, i) => (
            <div key={s.title} className="border-line bg-ink-0/55 grid gap-x-8 gap-y-2 border-t py-7 md:grid-cols-[3rem_14rem_1fr]">
              <span aria-hidden="true" data-reveal="rise" className="label pt-1.5">{String.fromCharCode(65 + i)}</span>
              <dt data-reveal="rise" className="font-display text-[1.625rem] font-medium tracking-[-0.02em]">{s.title}</dt>
              <dd data-reveal="rise" className="text-mute m-0 leading-relaxed">{s.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="stack-title" className="mt-24 lg:mt-40">
        <h2 id="stack-title" data-reveal="rise" className="label mb-5">Built with</h2>
        <ul data-reveal="stagger" className="font-display flex flex-wrap gap-x-7 gap-y-1 text-[clamp(1.5rem,3.4vw,3.5rem)] tracking-[-0.03em]">
          {study.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-24 flex flex-wrap items-center justify-between gap-6 lg:mt-40">
        <Magnetic>
          <TransitionLink href="/#work" transitionLabel="Selected Work" className="btn btn-line">
            <ArrowLeft aria-hidden="true" size={15} /> All Work
          </TransitionLink>
        </Magnetic>
        <div className="flex flex-wrap gap-2.5">
          <Magnetic>
            <TransitionLink href={next.caseStudy} transitionLabel={next.title} className="btn btn-line">
              Next: {next.title} <ArrowRight aria-hidden="true" size={15} />
            </TransitionLink>
          </Magnetic>
          <Magnetic>
            <TransitionLink href="/#contact" transitionLabel="Let's Talk" className="btn btn-primary">
              Get in Touch
            </TransitionLink>
          </Magnetic>
        </div>
      </footer>
    </article>
  );
}
