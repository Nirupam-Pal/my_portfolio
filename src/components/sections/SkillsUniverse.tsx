"use client";

import { useEffect, useRef } from "react";

import { TechIcon } from "@/components/ui/TechIcons";
import { clusters, skills } from "@/data/skills";
import { clusterLabels, skillLayout } from "@/scenes/layouts";
import { sceneStore, type LabelLayer } from "@/scenes/store";

import { StepHost } from "./ModelSteps";

/**
 * Desktop graph. The nodes live in the shared WebGL scene; the render loop keeps these labels over them.
 * Hovering a technology lights it, what it connects to and its category, and dims everything else.
 */
export function SkillsUniverse() {
  const layerRef = useRef<HTMLDivElement>(null);
  const items = useRef<LabelLayer["items"]>(new Map());

  useEffect(() => {
    const layer: LabelLayer = { el: layerRef.current!, poses: ["skills"], items: items.current };
    sceneStore.labelLayers.add(layer);
    return () => {
      sceneStore.labelLayers.delete(layer);
    };
  }, []);

  return (
    <div className="requires-webgl hidden lg:block">
      {/* Keeps the full list available to assistive technology, whatever is on screen. */}
      <ul className="sr-only">
        {clusters.map((c) => (
          <li key={c.id}>
            {c.label}
            {c.emerging ? " (emerging, currently learning)" : ""}: {skills.filter((s) => s.cluster === c.id).map((s) => s.label).join(", ")}
          </li>
        ))}
      </ul>

      <StepHost form="constellation" className="skill-graph">
        <div ref={layerRef} className="pointer-events-none fixed inset-0 z-10" style={{ visibility: "hidden" }}>
          {clusterLabels.map((c) => (
            <div
              key={c.id}
              aria-hidden="true"
              ref={(el) => {
                if (el) items.current.set(c.id, { el, at: c.at, tag: c.tag });
                else items.current.delete(c.id);
              }}
              className="skill-category absolute top-0 left-0 whitespace-nowrap will-change-transform"
            >
              <span className="label block -translate-x-1/2 -translate-y-1/2 text-[0.6rem]">
                {c.text}
                {c.id === "ai" && <span className="text-sky"> / Emerging</span>}
              </span>
            </div>
          ))}
          {skillLayout.map((s, i) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              data-step-item
              ref={(el) => {
                if (el) items.current.set(s.id, { el, at: s.position, tag: i });
                else items.current.delete(s.id);
              }}
              className="skill-label text-paper/85 pointer-events-auto absolute top-0 left-0 -mt-3.5 flex min-h-7 items-center whitespace-nowrap pl-3 font-mono text-[0.76rem] font-medium tracking-[0.03em] will-change-transform"
            >
              {/* On narrower screens the right-most labels read back towards the map, so they can't run off the screen. */}
              <span className={`bg-ink-0/55 flex items-center gap-2 px-1.5 py-0.5 ${s.position[0] > 3.6 ? "max-xl:-translate-x-[calc(100%+1.5rem)]" : ""}`}>
                <TechIcon id={s.id} size={15} className="shrink-0" />
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </StepHost>

      <p className="text-mute absolute bottom-6 left-(--gutter) max-w-[17rem] text-[0.9rem] leading-relaxed xl:bottom-14">
        Six clusters, one system. Hover a technology to see what it connects to.
      </p>
    </div>
  );
}
