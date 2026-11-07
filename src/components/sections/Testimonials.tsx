import { Quote } from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  return (
    <section id="testimonials" data-pose="testimonials" aria-labelledby="testimonials-title" className="z-content relative flex min-h-svh flex-col justify-center px-(--gutter) py-32">
      <SectionLabel index="04" title="Testimonials" className="mb-8" />
      <h2 id="testimonials-title" data-reveal="chars" className="display text-[clamp(3rem,6.4vw,7.25rem)]">
        <Split text={"What Clients\nSay."} />
      </h2>
      <ul data-reveal="stagger" className="mt-14 grid list-none gap-5 p-0 md:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.id} className="border-line bg-ink-1 flex flex-col border p-6 lg:p-8">
            <Quote aria-hidden="true" size={22} className="text-violet" />
            <blockquote className="mt-5 flex-1 text-[1.0625rem] leading-relaxed">{t.quote}</blockquote>
            <p className="border-line mt-6 border-t pt-4">
              <span className="font-display block font-medium">{t.name}</span>
              <span className="label mt-1 block">{t.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
