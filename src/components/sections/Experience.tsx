import { SheetLabel } from "@/components/ui/SheetLabel";
import { Split } from "@/components/ui/Split";

import { Timeline } from "./Timeline";

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="z-content relative min-h-svh px-(--gutter) pt-36 pb-32"
    >
      <div data-pose="experience">
        <SheetLabel sheet="03" title="Interactive Career Timeline" className="mb-8" />
        <h2 id="experience-title" data-reveal="chars" className="display heading-section">
          <Split text={"The\nJourney."} />
        </h2>
      </div>
      <Timeline />
    </section>
  );
}
