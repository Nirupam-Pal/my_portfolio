import * as THREE from "three";

import { codeFile, codeLines, type CodeTone } from "@/data/code";

import { LAPTOP } from "./layouts";

/** Keeps the screen on the lid: the same breathing as everything else in the scene. */
const VERT = /* glsl */ `
  uniform float uScale;
  uniform float uDrift;
  uniform float uTime;
  varying vec2 vUv;
  vec3 drifted(vec3 p, float time) {
    float w = sin(time * 0.42 + p.y * 0.9 + p.x * 0.35);
    return p + vec3(w * 0.6, sin(time * 0.33 + p.x * 0.7), w * 0.4) * uDrift;
  }
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(drifted(position * uScale, uTime), 1.0);
  }
`;

/** The text is drawn once; the shader decides how much of it has been typed, and where the caret is. */
const FRAG = /* glsl */ `
  uniform sampler2D uText;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uBlink;
  uniform vec2 uTyped;
  uniform vec4 uGrid;
  varying vec2 vUv;
  void main() {
    vec4 text = texture2D(uText, vUv);
    float x = (vUv.x - uGrid.x) / uGrid.z;
    float y = (1.0 - vUv.y - uGrid.y) / uGrid.w;
    float row = floor(y);
    float column = floor(x);
    float typed = x < 0.0 || y < 0.0 || row < uTyped.x || (row == uTyped.x && column < uTyped.y) ? 1.0 : 0.0;

    vec3 color = mix(vec3(0.028, 0.033, 0.052), text.rgb, text.a * typed);
    color += vec3(0.04, 0.05, 0.1) * (1.0 - length(vUv - 0.5));

    float caret = row == uTyped.x && column == uTyped.y && fract(x) < 0.16 && fract(y) > 0.14 && fract(y) < 0.86 ? 1.0 : 0.0;
    color = mix(color, vec3(0.22, 0.74, 0.97), caret * mix(1.0, step(0.5, fract(uTime * 0.9)), uBlink));

    gl_FragColor = vec4(color, uOpacity);
  }
`;

const TONES: Record<CodeTone, string> = {
  plain: "#c9cdd9",
  keyword: "#a78bfa",
  string: "#7dd3fc",
  name: "#f5f5f7",
  call: "#c4b5fd",
};

const WIDTH = 1536;
const HEIGHT = Math.round((WIDTH * LAPTOP.screen.h) / LAPTOP.screen.w);
const BAR = 104;
const GUTTER = 118;
const FONT_SIZE = 52;
const ROW = (HEIGHT - BAR - 44) / codeLines.length;
const CHARACTER = FONT_SIZE * 0.6;
const CHARACTERS_PER_SECOND = 26;

const lineLengths = codeLines.map((line) => line.reduce((n, [text]) => n + text.length, 0));

function draw(canvas: HTMLCanvasElement, family: string) {
  const c = canvas.getContext("2d");
  if (!c) return;
  c.clearRect(0, 0, WIDTH, HEIGHT);
  c.textBaseline = "middle";

  c.fillStyle = "rgba(255, 255, 255, 0.05)";
  c.fillRect(0, 0, WIDTH, BAR - 22);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
    c.fillStyle = color;
    c.beginPath();
    c.arc(46 + i * 40, (BAR - 22) / 2, 11, 0, Math.PI * 2);
    c.fill();
  });
  c.font = `500 34px ${family}`;
  c.fillStyle = "#9296a5";
  c.fillText(codeFile, 196, (BAR - 22) / 2 + 2);

  codeLines.forEach((line, i) => {
    const y = BAR + ROW * (i + 0.5);
    c.font = `400 36px ${family}`;
    c.fillStyle = "rgba(146, 150, 165, 0.55)";
    c.fillText(String(i + 1), 36, y);
    c.font = `500 ${FONT_SIZE}px ${family}`;
    let column = 0;
    line.forEach(([text, tone]) => {
      c.fillStyle = TONES[tone];
      // Set character by character, so the shader's grid lands on the letters whatever font this ends up being.
      [...text].forEach((ch) => {
        c.fillText(ch, GUTTER + column * CHARACTER, y);
        column++;
      });
    });
  });
}

/** The code on the laptop's lid. A real texture rather than instanced geometry, because it has to be readable. */
export class CodeScreen {
  readonly mesh: THREE.Mesh;
  private texture: THREE.CanvasTexture;
  private material: THREE.ShaderMaterial;
  private clock = 0;

  constructor(drift: { value: number }) {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const family = getComputedStyle(document.body).getPropertyValue("--font-mono").trim() || "monospace";
    draw(canvas, family);

    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.anisotropy = 8;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    document.fonts?.load(`500 ${FONT_SIZE}px ${family}`).then(() => {
      draw(canvas, family);
      this.texture.needsUpdate = true;
    }, () => undefined);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uText: { value: this.texture },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uBlink: { value: 1 },
        uScale: { value: 1 },
        uDrift: drift,
        uTyped: { value: new THREE.Vector2() },
        uGrid: { value: new THREE.Vector4(GUTTER / WIDTH, BAR / HEIGHT, CHARACTER / WIDTH, ROW / HEIGHT) },
      },
    });

    const geometry = new THREE.PlaneGeometry(LAPTOP.screen.w, LAPTOP.screen.h);
    geometry.rotateX(-LAPTOP.tilt);
    const [cx, cy, cz] = LAPTOP.screenCentre;
    geometry.translate(cx, cy, cz);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
  }

  /** `presence` is how far the scene has settled on a form that has the laptop in it. */
  update(presence: number, scale: number, time: number, dt: number, reduced: boolean) {
    this.mesh.visible = presence > 0.001;
    const u = this.material.uniforms;
    u.uOpacity.value = presence;
    u.uTime.value = time;
    if (scale > 0) u.uScale.value = scale;
    u.uBlink.value = reduced ? 0 : 1;

    // Types itself out each time it comes into view, from the moment the laptop has landed.
    if (!this.mesh.visible) this.clock = 0;
    else if (presence > 0.9) this.clock += dt;
    let left = reduced ? Infinity : this.clock * CHARACTERS_PER_SECOND;
    let row = 0;
    while (row < codeLines.length - 1 && left >= lineLengths[row] + 1) {
      left -= lineLengths[row] + 1;
      row++;
    }
    u.uTyped.value.set(row, Math.floor(Math.min(left, lineLengths[row])));
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
