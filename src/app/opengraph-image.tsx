import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Nirupam Pal, Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const font = await readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.woff"));

  // A plain drawing of the network: three layers, each joined to the next.
  const nodes = [0, 1, 2].flatMap((l) => {
    const count = [3, 4, 2][l];
    return Array.from({ length: count }, (_, n) => ({ left: 800 + l * 150, top: 315 + (n - (count - 1) / 2) * 110, sky: l !== 1 }));
  });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#08090D", color: "#F5F5F7", fontFamily: "Space Grotesk" }}>
        {nodes.map((node) => (
          <div
            key={`${node.left}${node.top}`}
            style={{ position: "absolute", left: node.left - 14, top: node.top - 14, width: 28, height: 28, borderRadius: 14, background: node.sky ? "#38BDF8" : "#8B5CF6" }}
          />
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, height: "100%", width: "100%" }}>
          <div style={{ fontSize: 26, letterSpacing: 2, color: "#9296A5" }}>THE COMPUTATIONAL UNIVERSE</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 148, lineHeight: 0.9, letterSpacing: -6 }}>NIRUPAM</div>
            <div style={{ fontSize: 148, lineHeight: 0.9, letterSpacing: -6 }}>PAL.</div>
            <div style={{ fontSize: 30, marginTop: 34, color: "#9296A5" }}>Full-Stack Developer</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, weight: 700, style: "normal" }] },
  );
}
