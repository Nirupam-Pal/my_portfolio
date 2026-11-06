"use client";

import { sceneStore } from "@/scenes/store";

interface ProjectLegendProps {
  items: readonly { group: number; label: string }[];
  accent: string;
}

/** Hovering or focusing a role lights up that part of the network in the 3D model. */
export function ProjectLegend({ items, accent }: ProjectLegendProps) {
  const set = (groups: readonly number[] | null) => {
    sceneStore.hoverGroups = groups;
    sceneStore.invalidate?.();
  };

  return (
    <div className="requires-webgl relative mb-3 lg:absolute lg:top-[10%] lg:right-0 lg:mb-0">
      <p className="label mb-1 text-[0.64rem] lg:text-right" id="legend-label">
        Highlight in the model
      </p>
      <ul aria-labelledby="legend-label" className="flex flex-wrap gap-1 lg:justify-end">
        {items.map(({ group, label }) => (
          <li key={label}>
            <button
              type="button"
              onPointerEnter={() => set([group])}
              onPointerLeave={() => set(null)}
              onFocus={() => set([group])}
              onBlur={() => set(null)}
              className="border-line hover:border-line-strong text-paper bg-ink-0/60 flex min-h-11 items-center gap-2 border px-3 font-mono text-[0.68rem] tracking-[0.08em] uppercase transition-colors"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: accent, opacity: 1 - group * 0.25 }} />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
