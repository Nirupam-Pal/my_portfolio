import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { aiCopy, aiLayers, aiRoadmap } from "@/data/ai";

import { NeuralLab } from "./NeuralLab";

/** A still drawing of the network, shown only when WebGL is unavailable. */
function NetworkDrawing() {
  const columns = aiLayers.map((layer, l) =>
    Array.from({ length: layer.nodes }, (_, n) => ({ x: 30 + l * 90, y: 110 + (n - (layer.nodes - 1) / 2) * 34 })),
  );
  return (
    <svg viewBox="0 0 330 220" className="mt-10 w-full max-w-md lg:mt-0 lg:max-w-none" fill="none" role="presentation">
      {columns.slice(0, -1).flatMap((column, l) =>
        column.flatMap((a) =>
          columns[l + 1].map((b) => <path key={`${a.x}${a.y}${b.x}${b.y}`} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="var(--color-line)" />),
        ),
      )}
      {columns.flat().map((p) => (
        <circle key={`${p.x}${p.y}`} cx={p.x} cy={p.y} r="6" fill={p.x < 100 ? "var(--color-sky)" : "var(--color-violet)"} />
      ))}
    </svg>
  );
}

export function ArtificialIntelligence() {
  return (
    <section id="ai" aria-labelledby="ai-title" className="ai-section z-content relative lg:h-[420svh]">
      {/* Scroll anchors: the network assembles, connects, carries signals, shows its depth, then settles. */}
      <div data-pose="ai-seed" className="absolute inset-x-0 top-[6%] h-px" />
      <div data-pose="ai-connect" className="absolute inset-x-0 top-[24%] h-px" />
      <div data-pose="ai-signal" className="absolute inset-x-0 top-[42%] h-px" />
      <div data-pose="ai-depth" className="absolute inset-x-0 top-[60%] h-px" />
      <div data-pose="ai-calm" className="absolute inset-x-0 top-[80%] h-px" />

      <div className="ai-pin px-(--gutter) pt-[46svh] pb-24 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:pt-16 lg:pb-0">
        <div className="bg-ink-0/60 -mx-(--gutter) px-(--gutter) py-6 lg:mx-0 lg:max-w-[40rem] lg:bg-transparent lg:px-0 lg:py-0">
          <SectionLabel index="05" title={aiCopy.eyebrow} className="mb-6" />
          <h2 id="ai-title" data-reveal="chars" className="display text-[clamp(3rem,6.4vw,7.25rem)]">
            <Split text={aiCopy.title} />
          </h2>
          <p data-reveal="rise" className="mt-6 max-w-[34rem] leading-relaxed lg:text-[1.0625rem]">
            {aiCopy.body}
          </p>
          <h3 data-reveal="rise" className="label mt-7">
            Areas of exploration
          </h3>
          <ul data-reveal="stagger" className="mt-2 grid max-w-[36rem] gap-x-6 sm:grid-cols-2">
            {aiRoadmap.map((topic) => (
              <li key={topic} className="border-line flex min-h-9 items-center gap-2.5 border-t py-1.5 text-[0.9rem]">
                <span aria-hidden="true" className="bg-sky h-1 w-1 shrink-0 rounded-full" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
        <div className="webgl-fallback lg:absolute lg:top-1/2 lg:right-(--gutter) lg:w-[40vw] lg:max-w-xl lg:-translate-y-1/2">
          <NetworkDrawing />
        </div>
      </div>
      <NeuralLab />
    </section>
  );
}
