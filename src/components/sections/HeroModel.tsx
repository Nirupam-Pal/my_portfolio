"use client";

import { heroSystems } from "@/data/stack";
import { heroLabels } from "@/scenes/layouts";
import type { PoseId } from "@/scenes/poses";

import { useLabelLayer, useShowsLabels } from "./ModelLabels";
import { PauseModels, StepHost } from "./ModelSteps";

const HERO_POSES: readonly PoseId[] = ["hero"];

/** Names the parts of the system. Each name is a real button that holds the sculpture on that part. */
export function HeroModel() {
  const shows = useShowsLabels();
  return shows ? <HeroLabels /> : null;
}

function HeroLabels() {
  const { layerRef, itemRef } = useLabelLayer(HERO_POSES);
  return (
    <StepHost form="core" className="requires-webgl">
      <div ref={layerRef} className="z-content pointer-events-none fixed inset-0" style={{ visibility: "hidden" }}>
        {heroLabels.map((system) => (
          <button
            key={system.id}
            ref={itemRef({ id: system.id, at: system.at, tag: system.tag })}
            type="button"
            data-step-item
            data-tagged=""
            data-align={system.end ? "end" : undefined}
            aria-label={`${system.label}: ${system.note}`}
            className="model-label model-label-button"
          >
            <span>{system.label}</span>
          </button>
        ))}
      </div>
    </StepHost>
  );
}

/** Says in words what the sculpture is lighting up, for every screen size. It is what makes the model readable on a phone. */
export function HeroModelCaption() {
  return (
    <div className="requires-webgl flex w-full min-w-0 items-start gap-1 sm:w-auto">
      <StepHost form="core" className="model-caption max-w-[38rem] min-w-0 flex-1">
        <p data-idle="" className="text-mute font-mono text-[0.72rem] leading-snug">
          One application, five connected parts.
        </p>
        {heroSystems.map((system) => (
          <p key={system.id} data-step-item className="font-mono text-[0.72rem] leading-snug">
            <span className="text-paper font-medium">{system.label}</span>
            <span className="text-mute"> / {system.note}</span>
          </p>
        ))}
      </StepHost>
      <PauseModels />
    </div>
  );
}
