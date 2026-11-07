"use client";

import { TransitionLink } from "@/components/ui/TransitionLink";
import { sceneStore } from "@/scenes/store";

/** The hero sculpture's own AI & ML cluster: the fifth of the parts its sequence walks through. */
const AI_STEP = 4;

const LINKS = ["M3 3L10 7", "M3 8L10 7", "M3 13L10 12", "M10 7L17 8", "M10 12L17 8", "M3 8L10 12"];
const NODES = [[3, 3], [3, 8], [3, 13], [10, 7], [10, 12], [17, 8]];

const hold = () => {
  sceneStore.pin = { form: "core", step: AI_STEP };
  sceneStore.invalidate?.();
};
const release = () => {
  if (sceneStore.pin?.form === "core" && sceneStore.pin.step === AI_STEP) sceneStore.pin = null;
  sceneStore.invalidate?.();
};

/**
 * What is being learned, kept apart from the job title it sits beside. Pointing at it turns the sculpture to its AI & ML
 * cluster, so the badge and the model say the same thing; following it leads to the section that says more.
 */
export function ExploringBadge() {
  return (
    <TransitionLink
      href="#ai"
      className="exploring"
      aria-label="Exploring AI and ML: learning, experimenting and building. Go to the AI and ML section"
      onPointerEnter={(e) => e.pointerType === "mouse" && hold()}
      onPointerLeave={release}
      onFocus={hold}
      onBlur={release}
    >
      <svg aria-hidden="true" viewBox="0 0 20 16" className="exploring-net" fill="none">
        {LINKS.map((d, i) => (
          <path key={d} d={d} style={{ "--i": i } as React.CSSProperties} />
        ))}
        {NODES.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={cx === 17 ? 1.6 : 1.15} />
        ))}
      </svg>
      <span>Exploring AI &amp; ML</span>
      <span aria-hidden="true" className="exploring-more">
        Learning, experimenting &amp; building.
      </span>
    </TransitionLink>
  );
}
