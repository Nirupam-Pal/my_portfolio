import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Award } from "lucide-react";

import { GithubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { projects } from "@/data/projects";

const project = projects[0];

export const metadata: Metadata = {
  title: "BloodLink Case Study",
  description: project.description,
  alternates: { canonical: "/work/bloodlink" },
  openGraph: { title: "BloodLink Case Study | Nirupam Pal", description: project.description, url: "/work/bloodlink" },
};

const systems = [
  {
    no: "A",
    title: "Access",
    body: "A NestJS REST API secured with JWT access and refresh tokens, role-based access control across User, Blood Bank and Admin roles, and OTP email verification through the Brevo API.",
  },
  {
    no: "B",
    title: "Discovery",
    body: "Location-based donor search that narrows the way real geography does: state, then district, then sub-division, then city.",
  },
  {
    no: "C",
    title: "Trust",
    body: "A medical eligibility questionnaire for donors, so the people a patient finds have been screened first.",
  },
  {
    no: "D",
    title: "Connection",
    body: "Real-time one-to-one chat with Socket.IO that opens automatically when a donor accepts a connection request, supported by in-app notifications.",
  },
  {
    no: "E",
    title: "Supply",
    body: "A live inventory dashboard for blood banks.",
  },
];


export default function BloodLinkCaseStudy() {
  return (
    <article
      data-pose="bloodlink"
      style={{ "--accent": project.accent } as React.CSSProperties}
      className="z-content relative px-(--gutter) pt-28 pb-20"
    >
      <Magnetic strength={0.2}>
        <TransitionLink href="/#work" transitionLabel="Selected Work" className="label text-paper flex min-h-11 items-center gap-2">
          <ArrowLeft aria-hidden="true" size={14} /> Selected Work
        </TransitionLink>
      </Magnetic>

      <header className="flex min-h-[calc(100svh-11rem)] flex-col justify-end pb-10">
        <p className="label text-crimson hero-fade mb-5" style={{ "--d": "200ms" } as React.CSSProperties}>Case Study / Project 01</p>
        {/* Above the fold, so it enters with CSS instead of waiting for hydration, like the home page's name. */}
        <h1 className="display text-[clamp(3.9rem,15vw,17rem)]">
          <Split text="BloodLink" hero />
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
              ariaLabel="Open the live BloodLink website (opens in a new tab)"
            >
              Live Site
            </ButtonLink>
            <ButtonLink
              href={project.repo}
              external
              variant="line"
              icon={<GithubIcon size={15} />}
              ariaLabel="BloodLink source code on GitHub (opens in a new tab)"
            >
              Code
            </ButtonLink>
          </div>
        </div>
      </header>

      <section aria-label="Recognition" className="border-line grid gap-px border-y py-8 md:grid-cols-2">
        {project.achievements?.map((a) => (
          <p key={a} data-reveal="rise" className="text-gold font-display flex items-center gap-3 py-2 text-[clamp(1.25rem,2vw,1.875rem)] tracking-[-0.02em]">
            <Award aria-hidden="true" size={20} className="shrink-0" />
            {a}
          </p>
        ))}
      </section>

      <figure className="mt-20 lg:mt-32">
        <div data-reveal="clip" className="capture-frame">
          <div data-parallax="3">
            <Image
              src={project.captures[0].src}
              alt={project.captures[0].alt}
              width={project.captures[0].width}
              height={project.captures[0].height}
              sizes="94vw"
              className="h-auto w-full scale-[1.08]"
            />
          </div>
        </div>
        <figcaption className="label mt-3 text-[0.64rem]">Live capture: {project.liveLabel}</figcaption>
      </figure>

      <section aria-labelledby="flow-title" className="mt-24 lg:mt-40">
        <h2 id="flow-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={"From search\nto conversation."} by="words" />
        </h2>
        <ol data-reveal="stagger" className="mt-10 grid list-none gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
          {project.flow.steps.map((step, i) => (
            <li key={step} className="border-line bg-ink-0/55 border-t py-5 pr-6">
              <span className="label text-crimson">0{i + 1}</span>
              <p className="font-display mt-3 text-[1.375rem] font-medium tracking-[-0.02em]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="systems-title" className="mt-24 lg:mt-40">
        <h2 id="systems-title" data-reveal="words" className="display text-[clamp(2.4rem,6vw,6.5rem)]">
          <Split text={"Inside the\nsystem."} by="words" />
        </h2>
        <dl className="mt-10 max-w-[64rem]">
          {systems.map((s) => (
            <div key={s.no} className="border-line bg-ink-0/55 grid gap-x-8 gap-y-2 border-t py-7 md:grid-cols-[3rem_14rem_1fr]">
              <span aria-hidden="true" data-reveal="rise" className="label pt-1.5">{s.no}</span>
              <dt data-reveal="rise" className="font-display text-[1.625rem] font-medium tracking-[-0.02em]">{s.title}</dt>
              <dd data-reveal="rise" className="text-mute m-0 leading-relaxed">{s.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="stack-title" className="mt-24 lg:mt-40">
        <h2 id="stack-title" data-reveal="rise" className="label mb-5">Built with</h2>
        <ul data-reveal="stagger" className="font-display flex flex-wrap gap-x-7 gap-y-1 text-[clamp(1.5rem,3.4vw,3.5rem)] tracking-[-0.03em]">
          {project.stack.map((s) => (
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
        <Magnetic>
          <TransitionLink href="/#contact" transitionLabel="Let's Talk" className="btn btn-primary">
            Get in Touch
          </TransitionLink>
        </Magnetic>
      </footer>
    </article>
  );
}
