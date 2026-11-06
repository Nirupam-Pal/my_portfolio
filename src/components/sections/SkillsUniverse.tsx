"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { clusters, skills } from "@/data/skills";
import { skillLayout } from "@/scenes/layouts";
import { sceneStore, type LabelLayer } from "@/scenes/store";

/**
 * Desktop constellation. The nodes live in the shared WebGL scene; these are real, focusable
 * DOM buttons that the render loop positions over them, so text stays crisp and accessible.
 */
export function SkillsUniverse() {
  const [focus, setFocus] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const items = useRef<LabelLayer["items"]>(new Map());
  const drag = useRef<{ x: number; yaw: number } | null>(null);

  const select = useCallback((id: string | null) => {
    setFocus(id);
    sceneStore.focusSkill = id;
    sceneStore.invalidate?.();
  }, []);

  useEffect(() => {
    const layer: LabelLayer = { el: layerRef.current!, poses: ["skills"], items: items.current };
    sceneStore.labelLayers.add(layer);
    return () => {
      sceneStore.labelLayers.delete(layer);
      sceneStore.focusSkill = null;
    };
  }, []);

  const current = skillLayout.find((s) => s.id === focus);
  const related = new Set(current?.linked ?? []);
  const linkedLabels = (current?.linked ?? [])
    .map((id) => skills.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="requires-webgl hidden lg:block">
      {/* Keeps the full list available to assistive technology, whatever is on screen. */}
      <ul className="sr-only">
        {clusters.map((c) => (
          <li key={c.id}>
            {c.label}: {skills.filter((s) => s.cluster === c.id).map((s) => s.label).join(", ")}
          </li>
        ))}
      </ul>

      {/* Drag surface. Focusing it scrolls the stage into view, which reveals the labels for keyboard users. */}
      <div
        tabIndex={0}
        role="group"
        aria-label="Interactive map of skills. Tab to move between technologies."
        data-cursor="drag"
        className="absolute inset-0 -z-10 touch-pan-y"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, yaw: sceneStore.dragYaw };
          sceneStore.dragging = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const next = drag.current.yaw + ((e.clientX - drag.current.x) / window.innerWidth) * 1.6;
          sceneStore.dragYaw = Math.max(-0.8, Math.min(0.8, next));
        }}
        onPointerUp={() => {
          drag.current = null;
          sceneStore.dragging = false;
        }}
      />

      <div ref={layerRef} className="pointer-events-none fixed inset-0 z-10" style={{ visibility: "hidden" }}>
        {skillLayout.map((s) => {
          const isFocus = focus === s.id;
          const dim = focus !== null && !isFocus && !related.has(s.id);
          return (
            <button
              key={s.id}
              ref={(el) => {
                if (el) items.current.set(s.id, { el, at: s.position });
                else items.current.delete(s.id);
              }}
              type="button"
              onPointerEnter={() => select(s.id)}
              onPointerLeave={() => select(null)}
              onFocus={() => select(s.id)}
              onBlur={() => select(null)}
              aria-label={`${s.label}, ${s.clusterLabel}`}
              className={`pointer-events-auto absolute top-0 left-0 -mt-3 flex min-h-6 items-center whitespace-nowrap pl-3 font-mono text-[0.76rem] font-medium tracking-[0.03em] transition-[color,opacity] duration-300 will-change-transform ${
                isFocus ? "text-paper" : related.has(s.id) ? "text-sky" : "text-paper/85"
              } ${dim ? "opacity-30" : "opacity-100"}`}
            >
              <span className="bg-ink-0/55 px-1.5 py-0.5">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="absolute bottom-6 left-(--gutter) max-w-sm xl:bottom-14">
        {current ? (
          <>
            <p className="label text-sky">{current.clusterLabel}</p>
            <p className="font-display mt-1 text-[1.75rem] font-medium tracking-[-0.02em]">{current.label}</p>
            {linkedLabels && <p className="text-mute mt-1 text-[0.9rem]">Connects to {linkedLabels}</p>}
          </>
        ) : (
          <p className="text-mute max-w-[17rem] text-[0.9rem] leading-relaxed">
            Five clusters, one system. Hover a technology to trace what it connects to, or drag to turn the map.
          </p>
        )}
      </div>
    </div>
  );
}
