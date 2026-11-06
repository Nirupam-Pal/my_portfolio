"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { PerspectiveCamera } from "three";

import { gsap } from "@/animations/gsap";

import { SculptureEngine } from "./engine";
import { loadForms } from "./loadForms";
import { sceneStore } from "./store";

function markNoWebGL() {
  document.documentElement.classList.add("no-webgl");
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    markNoWebGL();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Sculpture({ wrapper, onReady, compact }: { wrapper: HTMLElement | null; onReady: () => void; compact: boolean }) {
  const threeScene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const [engine, setEngine] = useState<SculptureEngine | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: SculptureEngine | null = null;

    loadForms().then(async (forms) => {
      if (cancelled) return;
      instance = new SculptureEngine(threeScene, forms, compact);
      // Shaders compile off the main thread where the browser allows it, so the first frame cannot stall the page.
      instance.group.visible = false;
      if (gl.extensions.has("KHR_parallel_shader_compile")) await gl.compileAsync(threeScene, camera).catch(() => undefined);
      if (cancelled) return;
      instance.group.visible = true;
      setEngine(instance);
      onReady();
    });

    return () => {
      cancelled = true;
      instance?.dispose();
      setEngine(null);
    };
  }, [threeScene, gl, camera, onReady, compact]);

  useEffect(() => {
    engine?.setCanvasElement(wrapper);
    // With on-demand rendering (reduced motion) nothing else would draw the finished sculpture.
    invalidate(3);
  }, [engine, wrapper, invalidate]);

  useFrame((state, delta) => {
    if (!engine) return;
    // Clamp, so a stall or a background tab never produces a visible jump.
    const dt = Math.min(delta, 0.05);
    engine.update(dt, state.camera as PerspectiveCamera, state.size.width, state.size.height);
  });

  return null;
}

/** Lowers resolution, not content, when the device cannot hold frame rate. */
function AdaptiveResolution({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useRef(max);
  const step = (by: number) => {
    dpr.current = Math.min(max, Math.max(0.9, dpr.current + by));
    setDpr(dpr.current);
  };
  return <PerformanceMonitor bounds={() => [42, 57]} onDecline={() => step(-0.25)} onIncline={() => step(0.1)} />;
}

/** The canvas draws from GSAP's ticker, so the page has one animation loop and DOM and 3D share each frame. */
function TickerDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const tick = (time: number) => advance(time);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);
  return null;
}

function Invalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    sceneStore.invalidate = invalidate;
    return () => {
      sceneStore.invalidate = null;
    };
  }, [invalidate]);
  return null;
}

export default function SceneCanvas({ onReady }: { onReady: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);
  const [settings] = useState(() => {
    const compact = window.matchMedia("(max-width: 767px)").matches;
    return {
      compact,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      maxDpr: compact ? 1.25 : Math.min(window.devicePixelRatio || 1, 1.75),
    };
  });

  useEffect(() => {
    setWrapper(wrapperRef.current);
  }, []);

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <SceneBoundary>
        <Canvas
          frameloop={settings.reduced ? "demand" : "never"}
          dpr={[0.9, settings.maxDpr]}
          camera={{ fov: 35, near: 0.1, far: 80, position: [0, -2.7, 13.2] }}
          gl={{
            alpha: true,
            antialias: !settings.compact,
            powerPreference: "high-performance",
            stencil: false,
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            gl.domElement.setAttribute("aria-hidden", "true");
            gl.domElement.addEventListener("webglcontextlost", markNoWebGL);
          }}
        >
          <Invalidator />
          {!settings.reduced && <TickerDriver />}
          <Sculpture wrapper={wrapper} onReady={onReady} compact={settings.compact} />
          {!settings.reduced && <AdaptiveResolution max={settings.maxDpr} />}
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
