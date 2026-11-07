"use client";

import { useEffect } from "react";

import { fitHeroName } from "./heroFitMeasure";

/**
 * The name gives way to the copy beneath it. An inline script sizes it before the first paint (see Hero); this keeps
 * it sized afterwards, whenever the copy or the screen changes size or a late font changes the copy's wrapping.
 * Both sit in full-height sticky layers pinned to the top, so their offsets share a frame.
 */
export function HeroFit() {
  useEffect(() => {
    const copy = document.querySelector<HTMLElement>("[data-hero-copy]");
    const layer = copy?.parentElement;
    if (!copy || !layer) return;

    const fit = () => void fitHeroName();
    const observer = new ResizeObserver(fit);
    observer.observe(copy);
    observer.observe(layer);
    fit();
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);
  return null;
}
