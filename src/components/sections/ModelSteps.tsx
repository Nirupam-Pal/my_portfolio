"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import type { FormId } from "@/scenes/geometry";
import { sceneStore } from "@/scenes/store";

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The models keep acting things out on their own, so anyone can stop them. The choice applies to all of them. */
export function PauseModels({ className = "" }: { className?: string }) {
  const paused = useSyncExternalStore(subscribe, () => sceneStore.sequencePaused, () => false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? "Resume the 3D model's sequence" : "Pause the 3D model's sequence"}
      onClick={() => {
        sceneStore.sequencePaused = !paused;
        listeners.forEach((l) => l());
      }}
      className={`text-mute hover:text-paper flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${className}`}
    >
      {paused ? <Play aria-hidden="true" size={12} /> : <Pause aria-hidden="true" size={12} />}
    </button>
  );
}

interface StepHostProps {
  form: FormId;
  className?: string;
  children: ReactNode;
}

/**
 * Connects page content to a form's sequence. Children marked [data-step-item] follow the model,
 * and hovering, focusing or tapping one holds the model on that step.
 */
export function StepHost({ form, className, children }: StepHostProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hosts = sceneStore.stepHosts.get(form) ?? new Set<HTMLElement>();
    sceneStore.stepHosts.set(form, hosts);
    hosts.add(el);
    return () => {
      hosts.delete(el);
      if (sceneStore.pin?.form === form) sceneStore.pin = null;
    };
  }, [form]);

  const hold = (target: EventTarget) => {
    const item = (target as Element).closest?.("[data-step-item]");
    if (!item || !ref.current) return;
    const step = [...ref.current.querySelectorAll("[data-step-item]")].indexOf(item);
    sceneStore.pin = { form, step };
    sceneStore.invalidate?.();
  };
  const release = () => {
    sceneStore.pin = null;
    sceneStore.invalidate?.();
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerOver={(e) => {
        if (e.pointerType === "mouse") hold(e.target);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") release();
      }}
      onFocus={(e) => hold(e.target)}
      onBlur={release}
    >
      {children}
    </div>
  );
}

interface ModelStepsProps {
  form: FormId;
  title: string;
  steps: readonly string[];
  accent: string;
  className?: string;
}

/** The steps a project's model is acting out, written down. Without WebGL the same facts are in the feature list. */
export function ModelSteps({ form, title, steps, accent, className = "" }: ModelStepsProps) {
  return (
    <div className={`requires-webgl relative mb-3 flex flex-col lg:absolute lg:mb-0 ${className}`}>
      <div className="label mb-1 flex items-center gap-1 text-[0.64rem]">
        <span>{title}</span>
        <PauseModels />
      </div>
      <StepHost form={form}>
        <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
          {steps.map((step, i) => (
            <li key={step}>
              <button
                type="button"
                data-step-item
                className="model-step bg-ink-0/80 flex min-h-7 items-center gap-2.5 px-2 font-mono text-[0.72rem] tracking-[0.03em]"
                style={{ "--accent": accent } as React.CSSProperties}
              >
                <span aria-hidden="true" style={{ color: accent }}>
                  0{i + 1}
                </span>
                {step}
                <span aria-hidden="true" className="model-step-mark h-px w-4" style={{ color: accent }} />
              </button>
            </li>
          ))}
        </ol>
      </StepHost>
    </div>
  );
}
