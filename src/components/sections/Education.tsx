import { SectionLabel } from "@/components/ui/SectionLabel";
import { education } from "@/data/profile";

export function Education() {
  return (
    <section
      id="education"
      data-pose="education"
      aria-labelledby="education-title"
      className="z-content relative px-(--gutter) lg:h-[150svh]"
    >
      {/* Long enough for the graph to resolve and be read before the last section begins. */}
      <div className="flex min-h-svh flex-col justify-center py-32 lg:sticky lg:top-0 lg:h-svh lg:py-0">
      <SectionLabel index="08" title="Knowledge Graph" className="mb-8" />
      <h2 id="education-title" data-reveal="rise" className="font-display mb-12 text-[clamp(1.75rem,3vw,3rem)] font-medium tracking-[-0.025em]">
        Education
      </h2>
      <ul className="max-w-[46rem]">
        {education.map((e) => (
          <li key={e.school} className="border-line grid gap-x-8 gap-y-3 border-t py-8 sm:grid-cols-[minmax(7rem,14rem)_1fr]">
            <p data-reveal="rise" className="font-display text-mute text-[clamp(2.75rem,5.6vw,5.5rem)] leading-none font-light tracking-[-0.045em]">
              {e.year}
            </p>
            <div data-reveal="stagger">
              <h3 className="font-display text-[clamp(1.3rem,2vw,1.875rem)] font-medium tracking-[-0.02em]">{e.school}</h3>
              <p className="text-paper/85 mt-2">{e.award}</p>
              <p className="label mt-3 flex flex-wrap gap-x-5 gap-y-1">
                <span className="text-sky">{e.detail}</span>
                <span>{e.place}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
