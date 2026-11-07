import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { expertise } from "@/data/profile";

import { EcosystemLayers } from "./EcosystemLayers";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="z-content relative px-(--gutter)">
      <div data-pose="about-stack" className="flex min-h-svh flex-col justify-center pt-28 pb-16">
        <SectionLabel index="01" title="The Person Behind the Code" className="mb-8" />
        <h2 id="about-title" data-reveal="chars" className="display heading-section">
          <Split text={"Beyond\nThe Code."} />
        </h2>
        <div className="mt-10 max-w-xl space-y-5 lg:mt-14">
          <p data-reveal="rise" className="body-lead">
            I&apos;m Nirupam Pal, a full-stack developer who likes building things people actually use.
          </p>
          <p data-reveal="rise" className="text-mute leading-relaxed">
            I studied Computer Science at ICFAI University Tripura (B.Tech, 2026, GPA 8.5/10). Since then my work has moved
            between code and people: shipping a Leave and Attendance module as a software developer intern, managing
            marketing projects for clients, and building a blood donation platform that won first prize at a hackathon.
          </p>
          <p data-reveal="rise" className="text-mute leading-relaxed">
            That is what the model beside this text is: the layers of an application, and the thinking and the people that
            make them work as one.
          </p>
        </div>
      </div>

      <ol className="m-0 list-none p-0">
        {expertise.map((layer, i) => (
          <li
            key={layer.id}
            data-pose={`about-${layer.id}`}
            className={`min-h-[118svh] pt-[12svh] ${i === 0 ? "lg:pt-[13svh]" : "lg:pt-[28svh]"}`}
          >
            {/* Each one holds its place while the camera moves across the stack, then the next pushes it out. */}
            <div className={`bg-ink-0/55 sticky top-[12svh] max-w-[46rem] py-4 backdrop-blur-[2px] lg:bg-transparent lg:py-0 lg:backdrop-blur-none ${i === 0 ? "lg:top-[13svh]" : "lg:top-[28svh]"}`}>
              <p data-reveal="rise" className="label mb-5 flex items-center gap-3">
                <span className="text-sky">0{i + 1}</span>
                <span aria-hidden="true" className="bg-line-strong h-px w-8" />
                <span>of 04</span>
              </p>
              <h3 data-reveal="words" className="display text-[length:var(--fs-title)]">
                <Split text={layer.title} by="words" />
              </h3>
              <p data-reveal="perspective" className={`text-mute max-w-[34rem] ${i === 0 ? "mt-4 leading-relaxed" : "body-lead mt-7"}`}>
                {layer.body}
              </p>
              {layer.id === "engineering" && <EcosystemLayers />}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
