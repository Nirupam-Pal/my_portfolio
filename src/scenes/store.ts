import type { FormId } from "./geometry";
import type { V3 } from "./layouts";
import type { PoseId } from "./poses";

/** DOM labels the render loop keeps positioned over points in the 3D model. */
export interface LabelLayer {
  el: HTMLElement;
  poses: readonly PoseId[];
  items: Map<string, { el: HTMLElement; at: V3; tag?: number }>;
}

/**
 * Mutable state shared between scroll choreography and the render loop.
 * Deliberately outside React: it changes every frame and must never trigger a render.
 */
export const sceneStore = {
  poseA: "hero" as PoseId,
  poseB: "hero" as PoseId,
  mix: 0,
  /** 0 = scattered, 1 = assembled. */
  assemble: 0,
  pointerX: 0,
  pointerY: 0,
  /** Temporarily overrides which beam and node groups are lit. */
  hoverGroups: null as readonly number[] | null,
  reducedMotion: false,
  labelLayers: new Set<LabelLayer>(),
  /** Page elements that follow a form's sequence. Their [data-step-item] children get data-active. */
  stepHosts: new Map<FormId, Set<HTMLElement>>(),
  /** A step held by hover or focus, which stops the sequence on it. */
  pin: null as { form: FormId; step: number } | null,
  sequencePaused: false,
  /** Called when something changes while the render loop is on demand. */
  invalidate: null as null | (() => void),
};

export type SceneStore = typeof sceneStore;
