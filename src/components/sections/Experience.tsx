import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";

import { Timeline } from "./Timeline";

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="z-content relative min-h-svh px-(--gutter) pt-36 pb-32"
    >
      <div data-pose="experience" className="lg:text-right">
        <SectionLabel index="03" title="Version History" className="mb-8 lg:justify-end" />
        <h2 id="experience-title" data-reveal="chars" className="display heading-section">
          <Split text={"The\nJourney."} />
        </h2>
        <p data-reveal="rise" className="text-mute requires-webgl mt-6 max-w-sm text-[0.9rem] lg:ml-auto leading-relaxed">
          A career drawn as a branching history. A way of picturing it, not a real repository.
        </p>
      </div>
      <Timeline />
    </section>
  );
}
