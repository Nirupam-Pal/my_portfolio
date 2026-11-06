"use client";

import { stackLayers } from "@/data/stack";

import { StepHost } from "./ModelSteps";

/** The layers of the exploded model, written down. Hovering or focusing one lights it and dims the others. */
export function EcosystemLayers() {
  return (
    <StepHost form="ecosystem" className="mt-6 max-w-[34rem]">
      <ul className="m-0 list-none p-0">
        {stackLayers.map((layer) => (
          <li key={layer.id}>
            <button type="button" data-step-item className="layer-row border-line bg-ink-0/55 grid min-h-11 w-full gap-x-4 border-t py-2 text-left sm:grid-cols-[1fr_auto]">
              <span className="font-display text-[1rem] font-medium tracking-[-0.01em]">{layer.label}</span>
              <span className="text-mute font-mono text-[0.68rem] leading-relaxed tracking-[0.03em] sm:text-right">{layer.tech.join(" / ")}</span>
              <span className="layer-role text-mute text-[0.875rem] leading-snug sm:col-span-2">
                <span>{layer.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </StepHost>
  );
}
