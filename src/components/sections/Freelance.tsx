import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { freelanceProjects } from "@/data/freelance";

import { StepHost } from "./ModelSteps";

/** Client websites, all live. The model beside them is the same laptop serving each site; hovering a card lights its window. */
export function Freelance() {
  return (
    <section id="freelance" data-pose="freelance" aria-labelledby="freelance-title" className="z-content relative px-(--gutter) py-32 lg:py-40">
      <div className="freelance-column lg:max-w-[62%]">
        <SectionLabel index="03" title="Client Projects" className="mb-8" />
        <h2 id="freelance-title" data-reveal="chars" className="display text-[clamp(3rem,6.4vw,7.25rem)]">
          <Split text={"Freelance\nWork."} />
        </h2>
        <p data-reveal="rise" className="mt-6 max-w-[34rem] leading-relaxed lg:text-[1.0625rem]">
          Alongside my own products, I build websites for businesses. Four of them are live: a chess academy, a marketing agency, a solar installer and a logistics company.
        </p>

        <StepHost form="freelance" className="mt-14">
          <ul className="grid list-none gap-5 p-0 sm:grid-cols-2">
            {freelanceProjects.map((project) => (
              <li key={project.id} data-step-item data-reveal="rise" className="border-line bg-ink-1 group flex flex-col border">
                <div className="overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.alt}
                    width={1280}
                    height={800}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 90vw"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="label text-sky">{project.sector}</p>
                  <h3 className="font-display mt-2 text-[1.35rem] font-medium tracking-[-0.02em]">{project.title}</h3>
                  <p className="text-mute mt-2 flex-1 text-[0.9375rem] leading-relaxed">{project.summary}</p>
                  <p className="text-mute mt-3 font-mono text-[0.7rem] tracking-[0.03em]">{project.includes.join(" / ")}</p>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit the ${project.title} website (opens in a new tab)`}
                    className="text-paper hover:text-sky mt-4 inline-flex min-h-11 items-center gap-2 self-start font-mono text-[0.75rem] font-medium tracking-[0.1em] uppercase transition-colors"
                  >
                    Visit site <ArrowUpRight aria-hidden="true" size={14} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </StepHost>
      </div>
    </section>
  );
}
