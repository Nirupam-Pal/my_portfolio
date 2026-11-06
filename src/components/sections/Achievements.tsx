import { SheetLabel } from "@/components/ui/SheetLabel";
import { Split } from "@/components/ui/Split";
import { achievements } from "@/data/profile";

export function Achievements() {
  return (
    <section id="achievements" aria-labelledby="achievements-title" className="z-content relative px-(--gutter)">
      <div data-pose="achievement-technovate" className="flex min-h-[86svh] flex-col justify-end pt-32 pb-10">
        <SheetLabel sheet="05" title="Cinematic Highlights" className="mb-8" />
        <h2 id="achievements-title" data-reveal="chars" className="display text-[clamp(3rem,9.2vw,10rem)]">
          <Split text={"Milestones\nThat Matter."} />
        </h2>
      </div>

      {achievements.map((a, i) => (
        <article
          key={a.id}
          data-pose={`achievement-${a.id}`}
          aria-labelledby={`${a.id}-title`}
          className="flex min-h-[104svh] flex-col justify-center py-16"
        >
          <div className="bg-ink-0/45 max-w-[52rem] lg:bg-transparent">
            <div data-reveal="rule" aria-hidden="true" className="bg-gold mb-6 h-px w-full max-w-[38rem] opacity-60" />
            <p data-reveal="rise" className="label text-gold mb-5 flex items-center gap-4">
              <span>0{i + 1}</span>
              <span>{a.kicker}</span>
            </p>
            <h3 id={`${a.id}-title`} data-reveal="words" className="display text-[clamp(2.6rem,6.6vw,7.25rem)]">
              <Split text={a.title} by="words" />
            </h3>
            <p data-reveal="perspective" className="body-lead text-paper/80 mt-7 max-w-[32rem]">
              {a.body}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
