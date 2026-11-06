"use client";

import { neurons } from "@/scenes/layouts";
import type { PoseId } from "@/scenes/poses";

import { useLabelLayer, useShowsLabels } from "./ModelLabels";
import { StepHost } from "./ModelSteps";

const LAB_POSES: readonly PoseId[] = ["ai-signal", "ai-depth", "ai-calm"];

/** Invisible targets over the neurons. Hovering one lights only the connections it has. */
export function NeuralLab() {
  const shows = useShowsLabels();
  return shows ? <Targets /> : null;
}

function Targets() {
  const { layerRef, itemRef } = useLabelLayer(LAB_POSES);
  return (
    <StepHost form="neural" className="requires-webgl">
      <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-10" style={{ visibility: "hidden" }}>
        {neurons.map((n, i) => (
          <button
            key={`${n.at.join()}`}
            ref={itemRef({ id: `n${i}`, at: n.at })}
            type="button"
            tabIndex={-1}
            data-step-item
            className="pointer-events-auto absolute top-0 left-0 -mt-4 -ml-4 h-8 w-8 rounded-full"
          />
        ))}
      </div>
    </StepHost>
  );
}
