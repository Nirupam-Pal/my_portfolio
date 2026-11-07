"use client";

import { ArrowUpRight } from "lucide-react";

import { TransitionLink } from "@/components/ui/TransitionLink";
import { achievements } from "@/data/profile";
import { MILESTONE } from "@/scenes/layouts";
import type { PoseId } from "@/scenes/poses";

import { useLabelLayer, useShowsLabels } from "./ModelLabels";
import { StepHost } from "./ModelSteps";

const POSES: readonly PoseId[] = ["milestones"];
const SPOTS = [
  { at: MILESTONE.technovate, side: "start" },
  { at: MILESTONE.policy, side: "end" },
] as const;

/**
 * Lets the 3D nodes themselves be hovered, and floats each achievement's details beside its node. Everything here,
 * links included, is also in the page's text, so it is left out of the tab order and hidden from assistive technology.
 */
export function MilestoneHotspots() {
  const shows = useShowsLabels();
  return shows ? <Spots /> : null;
}

function Spots() {
  const { layerRef, itemRef } = useLabelLayer(POSES);
  return (
    <StepHost form="milestones" className="requires-webgl">
      <div ref={layerRef} aria-hidden="true" className="z-content pointer-events-none fixed inset-0" style={{ visibility: "hidden" }}>
        {achievements.map((a, i) => (
          <div key={a.id} ref={itemRef({ id: a.id, at: SPOTS[i].at, tag: i })} className="milestone-spot" data-side={SPOTS[i].side}>
            <TransitionLink href="/work/bloodlink" transitionLabel="BloodLink" tabIndex={-1} data-step-item className="milestone-spot-target">
              <span className="sr-only">{a.title.replace("\n", " ")}</span>
            </TransitionLink>
            <div className="milestone-info">
              <p className="label text-gold text-[0.62rem]">{a.kicker}</p>
              <p className="font-display mt-1.5 text-[1.0625rem] leading-tight font-medium tracking-[-0.02em]">{a.title.replace("\n", " ")}</p>
              <p className="text-mute mt-1.5 text-[0.8125rem] leading-snug">{a.body}</p>
              <p className="text-paper mt-2 flex items-center gap-1.5 font-mono text-[0.66rem] tracking-[0.08em] uppercase">
                BloodLink case study <ArrowUpRight aria-hidden="true" size={11} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </StepHost>
  );
}
