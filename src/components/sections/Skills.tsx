import { Plus } from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { TechIcon } from "@/components/ui/TechIcons";
import { clusters, skills } from "@/data/skills";

import { SkillsUniverse } from "./SkillsUniverse";

export function Skills() {
  return (
    <section
      id="skills"
      data-pose="skills"
      aria-labelledby="skills-title"
      className="z-content relative min-h-svh lg:h-[170svh]"
    >
      <div className="px-(--gutter) pt-36 pb-24 lg:sticky lg:top-0 lg:h-svh lg:pt-24 lg:pb-0">
        <SectionLabel index="06" title="Technology Graph" className="mb-6" />
        <h2 id="skills-title" data-reveal="chars" className="display text-[clamp(3.4rem,6vw,7rem)]">
          <Split text={"My\nToolkit."} />
        </h2>

        <SkillsUniverse />

        {/* Small screens, and any screen without WebGL: accessible expandable categories. */}
        <div className="skills-list mt-12 lg:hidden">
          {clusters.map((cluster, i) => {
            const members = skills.filter((s) => s.cluster === cluster.id);
            return (
              <details key={cluster.id} open={i === 0} className="border-line bg-ink-0/60 border-t last:border-b">
                <summary className="flex min-h-16 items-center justify-between gap-4 py-4">
                  <span className="font-display text-[1.5rem] font-medium tracking-[-0.02em]">
                    {cluster.label}
                    {cluster.emerging && <span className="label text-sky ml-3 align-middle text-[0.6rem]">Emerging</span>}
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="label">{String(members.length).padStart(2, "0")}</span>
                    <Plus aria-hidden="true" size={18} className="details-mark transition-transform duration-300" />
                  </span>
                </summary>
                <ul className="flex flex-wrap gap-x-5 gap-y-2.5 pb-6">
                  {members.map((s) => (
                    <li key={s.id} className="text-mute flex items-center gap-2">
                      <TechIcon id={s.id} size={17} className="text-paper shrink-0" />
                      {s.label}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
