import { ArrowUpRight } from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { achievements } from "@/data/profile";

import { MilestoneHotspots } from "./MilestoneHotspots";
import { StepHost } from "./ModelSteps";

/** Both achievements are for BloodLink, so its case study is where each one leads. */
const DESTINATION = { href: "/work/bloodlink", label: "BloodLink" };

/** A still drawing of the trophy, shown only when WebGL is unavailable. */
function TrophyDrawing() {
  return (
    <svg viewBox="0 0 320 340" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.25" role="presentation">
      <path d="M96 70h128c0 62-14 112-64 122-50-10-64-60-64-122z" />
      <path d="M96 86H60c0 44 18 66 52 72M224 86h36c0 44-18 66-52 72" />
      <path d="M160 192v56M132 248h56l16 26H116zM100 274h120v18H100z" />
      <path d="m160 14 8 17 19 2-14 13 4 19-17-10-17 10 4-19-14-13 19-2z" stroke="var(--color-gold)" />
      <path d="M44 120c-10 70 30 150 92 176M276 120c10 70-30 150-92 176" stroke="var(--color-gold)" opacity="0.7" />
    </svg>
  );
}

/** The trophy takes the middle of the page, with the achievements either side of it: the lead on its left, the other on its right. */
export function Achievements() {
  const [featured, supporting] = achievements;
  return (
    <section
      id="achievements"
      data-pose="milestones"
      aria-labelledby="achievements-title"
      className="achievements z-content relative flex min-h-svh flex-col justify-center px-(--gutter) pt-[48svh] pb-20 lg:pt-24 lg:pb-10"
    >
      <div className="webgl-fallback text-mute pointer-events-none absolute top-[56%] left-1/2 h-[46svh] w-[30vw] max-w-lg -translate-x-1/2 -translate-y-1/2 opacity-70 max-lg:hidden">
        <TrophyDrawing />
      </div>

      <div className="achievements-column max-lg:bg-ink-0/75 relative max-lg:-mx-(--gutter) max-lg:px-(--gutter) max-lg:py-6 lg:flex lg:flex-1 lg:flex-col lg:justify-between">
        <header className="lg:text-center">
          <SectionLabel index="07" title="Achievements" className="mb-5 lg:justify-center" />
          <h2 id="achievements-title" data-reveal="chars" className="display heading-oneline text-[clamp(2.6rem,4.4vw,5.25rem)]">
            <Split text={"Milestones\nThat Matter."} />
          </h2>
        </header>

        <StepHost form="milestones" className="mt-9 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-6">
          <article data-step-item aria-labelledby={`${featured.id}-title`} className="milestone-row group relative pb-8 lg:col-span-3 lg:pb-0">
            <div data-reveal="rule" aria-hidden="true" className="bg-gold mb-5 h-px w-full opacity-60" />
            <p data-reveal="rise" className="label text-gold mb-3 flex items-center gap-3">
              <span>01</span>
              <span>{featured.kicker}</span>
            </p>
            <h3 id={`${featured.id}-title`} data-reveal="words" className="display text-[clamp(1.85rem,2.7vw,3.1rem)]">
              <Split text={featured.title} by="words" />
            </h3>
            <div data-reveal="rise">
            <p className="text-paper/80 mt-3 leading-relaxed">
              {featured.body}
            </p>
            <p className="mt-3">
              <TransitionLink href={DESTINATION.href} transitionLabel={DESTINATION.label} className="milestone-link" aria-label={`${featured.title.replace("\n", " ")}: read the ${DESTINATION.label} case study`}>
                {DESTINATION.label} case study <ArrowUpRight aria-hidden="true" size={13} />
              </TransitionLink>
            </p>
            </div>
          </article>

          <article data-step-item aria-labelledby={`${supporting.id}-title`} className="milestone-row group relative lg:col-span-3 lg:col-start-10 lg:text-right">
            <div data-reveal="rule" aria-hidden="true" className="bg-line-strong mb-4 h-px w-full" />
            <p data-reveal="rise" className="label mb-2 flex items-center gap-3 lg:justify-end">
              <span className="text-gold">02</span>
              <span>{supporting.kicker}</span>
            </p>
            <h3 id={`${supporting.id}-title`} data-reveal="rise" className="font-display text-[clamp(1.35rem,1.9vw,1.9rem)] leading-tight font-medium tracking-[-0.025em]">
              {supporting.title.replace("\n", " ")}
            </h3>
            <div data-reveal="rise">
            <p className="text-mute mt-2 text-[0.9375rem] leading-relaxed">
              {supporting.body}
            </p>
            <p className="mt-3">
              <TransitionLink href={DESTINATION.href} transitionLabel={DESTINATION.label} className="milestone-link" aria-label={`${supporting.title.replace("\n", " ")}: read the ${DESTINATION.label} case study`}>
                {DESTINATION.label} case study <ArrowUpRight aria-hidden="true" size={13} />
              </TransitionLink>
            </p>
            </div>
          </article>
        </StepHost>
      </div>

      <MilestoneHotspots />
    </section>
  );
}
