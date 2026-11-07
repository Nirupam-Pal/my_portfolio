"use client";

import { useEffect } from "react";

/** Space kept between the last line of the name and the first line of the copy. */
const GAP = 24;

/**
 * The name gives way to the copy beneath it. CSS makes an estimate so the first paint is right on common screens; this
 * replaces it with a measurement: the room actually left between the top of the name and the first line of the copy,
 * whenever either the copy or the screen changes size. Wrapping, a late font or an unusual window can then never put
 * the two on top of each other. Both sit in full-height sticky layers pinned to the top, so their offsets share a frame.
 */
export function HeroFit() {
  useEffect(() => {
    const name = document.querySelector<HTMLElement>(".hero-name");
    const holder = document.querySelector<HTMLElement>("[data-hero-name]");
    const copy = document.querySelector<HTMLElement>("[data-hero-copy]");
    const first = copy?.firstElementChild as HTMLElement | null;
    const layer = copy?.parentElement;
    if (!name || !holder || !copy || !first || !layer) return;

    const fit = () => {
      const size = parseFloat(getComputedStyle(name).fontSize);
      if (!size || !name.offsetHeight) return;
      // How tall the name is for each pixel of type, whatever its line height and masks add.
      const ratio = name.offsetHeight / size;
      const copyTop = layer.clientHeight - copy.offsetHeight + first.offsetTop;
      const room = copyTop - GAP - holder.offsetTop;
      name.style.setProperty("--hero-fit", `${Math.max(room / ratio, 40)}px`);
    };

    const observer = new ResizeObserver(fit);
    observer.observe(copy);
    observer.observe(layer);
    fit();
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);
  return null;
}
