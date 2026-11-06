import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Nirupam Pal, Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const font = await readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.woff"));

  // A plain elevation of the tower: floors stepping and twisting upward.
  const floors = Array.from({ length: 13 }, (_, i) => {
    const f = i / 12;
    return {
      width: 150 + 110 * Math.abs(Math.cos(f * 1.25)) + 30 * Math.sin(f * 4),
      left: 860 + 18 * Math.sin(f * 6),
      top: 560 - f * 500,
    };
  });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#08090D", color: "#F5F5F7", fontFamily: "Space Grotesk" }}>
        {floors.map((floor) => (
          <div
            key={floor.top}
            style={{
              position: "absolute",
              left: floor.left - floor.width / 2,
              top: floor.top,
              width: floor.width,
              height: 2,
              background: "#8B5CF6",
              opacity: 0.85,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 860, top: 40, width: 2, height: 550, background: "#38BDF8" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, height: "100%", width: "100%" }}>
          <div style={{ fontSize: 26, letterSpacing: 2, color: "#9296A5" }}>THE DIGITAL ARCHITECT</div>
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
