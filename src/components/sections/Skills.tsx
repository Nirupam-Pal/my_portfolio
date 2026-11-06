import { Plus } from "lucide-react";

import { SheetLabel } from "@/components/ui/SheetLabel";
import { Split } from "@/components/ui/Split";
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
        <SheetLabel sheet="04" title="Skill Universe" className="mb-6" />
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
                  <span className="font-display text-[1.5rem] font-medium tracking-[-0.02em]">{cluster.label}</span>
                  <span className="flex items-center gap-4">
                    <span className="label">{String(members.length).padStart(2, "0")}</span>
                    <Plus aria-hidden="true" size={18} className="details-mark transition-transform duration-300" />
                  </span>
                </summary>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pb-6">
                  {members.map((s) => (
                    <li key={s.id} className="text-mute">
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
