"use client";

import { work } from "@/data/stack";
import { towerModules, towerTech, towerTiers } from "@/scenes/layouts";
import type { PoseId } from "@/scenes/poses";

import { useLabelLayer, useShowsLabels } from "./ModelLabels";
import { PauseModels, StepHost } from "./ModelSteps";

const HERO_POSES: readonly PoseId[] = ["hero"];

/**
 * What the tower is: the stack in its core, and real work plugged into it. The modules are real buttons;
 * the technologies only appear once something that uses them is lit.
 */
export function HeroModel() {
  const shows = useShowsLabels();
  return shows ? <HeroLabels /> : null;
}

function HeroLabels() {
  const { layerRef, itemRef } = useLabelLayer(HERO_POSES);
  return (
    <StepHost form="tower" className="requires-webgl">
      <div ref={layerRef} className="z-content pointer-events-none fixed inset-0" style={{ visibility: "hidden" }}>
        {towerTiers.map((tier) => (
          <div key={tier.label} ref={itemRef({ id: tier.label, at: tier.at })} aria-hidden="true" className="model-label model-label--tier">
            <span>{tier.label}</span>
          </div>
        ))}
        {towerTech.map((tech) => (
          <div key={tech.label} ref={itemRef({ id: tech.label, at: tech.at, tag: tech.tag })} aria-hidden="true" className="model-label" data-tagged="" data-when-lit="">
            <span>{tech.label}</span>
          </div>
        ))}
        {towerModules.flatMap((module) =>
          module.team.map((person) => (
            <div key={person.label} ref={itemRef({ id: person.label, at: person.at, tag: module.tag })} aria-hidden="true" className="model-label" data-tagged="" data-when-lit="" data-align="end">
              <span>{person.label}</span>
            </div>
          )),
        )}
        {towerModules.map((module, m) => (
          <button
            key={module.id}
            ref={itemRef({ id: module.id, at: module.labelAt, tag: module.tag })}
            type="button"
            data-step-item
            data-tagged=""
            data-align="end"
            aria-label={`${module.label}: ${work[m].note}`}
            className="model-label model-label-button"
          >
            <span>{module.label}</span>
          </button>
        ))}
      </div>
    </StepHost>
  );
}

/** Says in words what the tower is lighting up, for every screen size. It is what makes the model readable on a phone. */
export function HeroModelCaption() {
  return (
    <div className="requires-webgl flex w-full min-w-0 items-start gap-1 sm:w-auto">
      <StepHost form="tower" className="model-caption max-w-[38rem] min-w-0 flex-1">
        <p data-idle="" className="text-mute font-mono text-[0.72rem] leading-snug">
          Five pieces of real work, wired into one stack.
        </p>
        {work.map((item) => (
          <p key={item.id} data-step-item className="font-mono text-[0.72rem] leading-snug">
            <span className="text-paper font-medium">{item.label}</span>
            <span className="text-mute"> / {item.note}</span>
          </p>
        ))}
      </StepHost>
      <PauseModels />
    </div>
  );
}
