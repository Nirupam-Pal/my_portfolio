"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { gsap, prefersReducedMotion } from "@/animations/gsap";
import { sceneStore } from "@/scenes/store";

const SceneCanvas = dynamic(() => import("@/scenes/SceneCanvas"), { ssr: false });

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Loads 3D after first paint: text is the LCP and should never wait on Three.js. */
export function SceneLoader() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    sceneStore.reducedMotion = prefersReducedMotion();

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!webglAvailable() || connection?.saveData) {
      document.documentElement.classList.add("no-webgl");
      return;
    }

    // The name lands first, then the steel arrives around it.
    let idle = 0;
    const start = () => setLoad(true);
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(start, { timeout: 1200 });
      else start();
    }, window.matchMedia("(max-width: 767px)").matches ? 1800 : 650);
    return () => {
      clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      sceneStore.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      sceneStore.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const handleReady = useCallback(() => {
    if (prefersReducedMotion()) {
      sceneStore.assemble = 1;
      sceneStore.invalidate?.();
      return;
    }
    // Returning mid-page there is nothing to watch being built.
    if (window.scrollY > window.innerHeight * 0.5) {
      sceneStore.assemble = 1;
      return;
    }
    gsap.to(sceneStore, { assemble: 1, duration: 3.1, ease: "power2.inOut" });
  }, []);

  if (!load) return null;

  return (
    <div id="scene" className="requires-webgl z-canvas pointer-events-none fixed inset-0" aria-hidden="true">
      <SceneCanvas onReady={handleReady} />
    </div>
  );
}
