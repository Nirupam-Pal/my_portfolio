import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";

import { TestimonialStack } from "./TestimonialStack";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      data-pose="testimonials"
      aria-labelledby="testimonials-title"
      className="z-content relative flex min-h-svh flex-col justify-center overflow-x-clip px-(--gutter) py-28"
    >
      <TestimonialStack>
        <SectionLabel index="04" title="Testimonials" className="mb-5 lg:justify-center" />
        <h2 id="testimonials-title" data-reveal="chars" className="display heading-oneline text-[clamp(2.75rem,4.4vw,5.25rem)]">
          <Split text={"What Clients\nSay."} />
        </h2>
      </TestimonialStack>
    </section>
  );
}
