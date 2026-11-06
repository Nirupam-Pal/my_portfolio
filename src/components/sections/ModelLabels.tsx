"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { LABEL_SETS, type ModelLabelSpec } from "@/scenes/layouts";
import type { PoseId } from "@/scenes/poses";
import { sceneStore, type LabelLayer } from "@/scenes/store";

const LABELS_QUERY = "(min-width: 1280px)";

/**
 * Projected labels only exist on screens large enough to show them. Phones never pay to hydrate them,
 * and the facts they carry are all in the page's text.
 */
export function useShowsLabels() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(LABELS_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(LABELS_QUERY).matches,
    () => false,
  );
}

/** Registers a fixed layer of labels with the render loop, which keeps each one over its point in the model. */
export function useLabelLayer(poses: readonly PoseId[]) {
  const layerRef = useRef<HTMLDivElement>(null);
  const items = useRef<LabelLayer["items"]>(new Map());

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const layer: LabelLayer = { el, poses, items: items.current };
    sceneStore.labelLayers.add(layer);
    return () => {
      sceneStore.labelLayers.delete(layer);
    };
  }, [poses]);

  const itemRef = (spec: Pick<ModelLabelSpec, "id" | "at" | "tag">) => (el: HTMLElement | null) => {
    if (el) items.current.set(spec.id, { el, at: spec.at, tag: spec.tag });
    else items.current.delete(spec.id);
  };

  return { layerRef, itemRef };
}

function LabelSet({ poses, labels }: { poses: readonly PoseId[]; labels: readonly ModelLabelSpec[] }) {
  const { layerRef, itemRef } = useLabelLayer(poses);
  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0" style={{ visibility: "hidden" }}>
      {labels.map((label) => (
        <div
          key={label.id}
          ref={itemRef(label)}
          className="model-label"
          data-align={label.align}
          data-tagged={label.tag !== undefined ? "" : undefined}
          data-when-lit={label.whenLit ? "" : undefined}
        >
          <span>{label.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Says what the parts of each model are. Everything here is also in the page's text, so it is hidden from assistive technology. */
export function ModelLabels() {
  const shows = useShowsLabels();
  if (!shows) return null;
  return (
    <div aria-hidden="true" className="requires-webgl z-content pointer-events-none fixed inset-0">
      {LABEL_SETS.map((set) => (
        <LabelSet key={set.poses.join()} poses={set.poses} labels={set.labels} />
      ))}
    </div>
  );
}
