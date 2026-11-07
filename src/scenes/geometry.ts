/**
 * Every form in the experience is built from the same fixed pool of instances.
 * A generator describes a form as machined blocks, light paths, glass panels and nodes;
 * the engine then interpolates between any two forms, so nothing ever cuts or fades:
 * the modules of the hero's core physically become each later system.
 */
import { clusters, skillLinks } from "@/data/skills";

import {
  arc,
  avatarOf,
  BLOOD,
  bloodFrame,
  CLIENT_SITES,
  CLIENT_WINDOW,
  clusterLayout,
  CONVERGE,
  CORE,
  ECOSYSTEM,
  GIT,
  KNOWLEDGE,
  layerTech,
  layerX,
  lane,
  listingAt,
  listings,
  MILESTONE,
  neuralRing,
  neurons,
  PRO,
  skillLayout,
  skillLinkTag,
  synapses,
  synapseTag,
  type V3,
  LAPTOP,
  terrain,
  VOICE_FRAMES,
} from "./layouts";

export const COUNT = { beams: 480, paths: 170, panels: 44, nodes: 96 } as const;
export const STRIDE = { beams: 8, paths: 7, panels: 10, nodes: 4 } as const;

export interface Form {
  /** ax ay az bx by bz width height */
  beams: Float32Array;
  beamGroups: Uint8Array;
  beamTags: Int16Array;
  /** ax ay az bx by bz phase */
  paths: Float32Array;
  pathTags: Int16Array;
  /** cx cy cz ux uy uz vx vy vz glow; u and v are half-extents */
  panels: Float32Array;
  panelTags: Int16Array;
  /** x y z radius */
  nodes: Float32Array;
  nodeGroups: Uint8Array;
  nodeTags: Int16Array;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BeamRecord {
  a: V3;
  b: V3;
  t: number;
  h: number;
  group: number;
  tag: number;
}

class FormBuilder {
  private beamsList: BeamRecord[] = [];
  private pathsList: { a: V3; b: V3; phase: number; tag: number }[] = [];
  private panelsList: { c: V3; u: V3; v: V3; glow: number; tag: number }[] = [];
  private nodesList: { p: V3; r: number; group: number; tag: number }[] = [];
  private rng: () => number;

  constructor(
    seed: number,
    private readonly bounds: { min: V3; max: V3 },
  ) {
    this.rng = mulberry(seed);
  }

  random() {
    return this.rng();
  }

  beam(a: V3, b: V3, t = 0.02, group = 0, tag = -1) {
    this.beamsList.push({ a, b, t, h: t, group, tag });
  }

  /** A flat plate from one edge to the other, level across its width: how something can tilt, like a lid. */
  slab(a: V3, b: V3, width: number, thickness: number, group = 0, tag = -1) {
    this.beamsList.push({ a, b, t: width, h: thickness, group, tag });
  }

  /** A solid machined block, turned by yaw around its vertical axis. Size is length, height, depth. */
  block(c: V3, s: V3, yaw = 0, group = 0, tag = -1) {
    const dx = (Math.cos(yaw) * s[0]) / 2;
    const dz = (Math.sin(yaw) * s[0]) / 2;
    this.beamsList.push({ a: [c[0] - dx, c[1], c[2] - dz], b: [c[0] + dx, c[1], c[2] + dz], t: s[2], h: s[1], group, tag });
  }

  /** A ring of solid segments lying flat, like the rim of a machined disc. */
  ring(c: V3, r: number, h: number, w: number, sides: number, group = 0, tag = -1, turn = 0) {
    const len = 2 * r * Math.tan(Math.PI / sides);
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + turn;
      this.block([c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r], [len, h, w], a + Math.PI / 2, group, tag);
    }
  }

  polyline(points: readonly V3[], t = 0.02, group = 0, closed = false, tag = -1) {
    for (let i = 0; i < points.length - 1; i++) this.beam(points[i], points[i + 1], t, group, tag);
    if (closed) this.beam(points[points.length - 1], points[0], t, group, tag);
  }

  box(c: V3, s: V3, t: number, group = 0, tag = -1) {
    const [x, y, z] = c;
    const [w, h, d] = [s[0] / 2, s[1] / 2, s[2] / 2];
    const p: V3[] = [
      [x - w, y - h, z - d],
      [x + w, y - h, z - d],
      [x + w, y - h, z + d],
      [x - w, y - h, z + d],
      [x - w, y + h, z - d],
      [x + w, y + h, z - d],
      [x + w, y + h, z + d],
      [x - w, y + h, z + d],
    ];
    this.polyline(p.slice(0, 4), t, group, true, tag);
    this.polyline(p.slice(4, 8), t, group, true, tag);
    for (let i = 0; i < 4; i++) this.beam(p[i], p[i + 4], t, group, tag);
  }

  path(a: V3, b: V3, phase: number, tag = -1) {
    this.pathsList.push({ a, b, phase, tag });
  }

  /** Lays a run of light along connected points, phased so the pulse travels. */
  route(points: readonly V3[], phase = 0, step = 0.035, tag = -1) {
    for (let i = 0; i < points.length - 1; i++) this.path(points[i], points[i + 1], phase + i * step, tag);
  }

  panel(c: V3, u: V3, v: V3, glow = 0, tag = -1) {
    this.panelsList.push({ c, u, v, glow, tag });
  }

  /** A panel filling the quad between four corners given in order. */
  quad(p0: V3, p1: V3, p2: V3, p3: V3, glow = 0, tag = -1) {
    const c: V3 = [
      (p0[0] + p1[0] + p2[0] + p3[0]) / 4,
      (p0[1] + p1[1] + p2[1] + p3[1]) / 4,
      (p0[2] + p1[2] + p2[2] + p3[2]) / 4,
    ];
    const u: V3 = [(p1[0] - p0[0]) / 2, (p1[1] - p0[1]) / 2, (p1[2] - p0[2]) / 2];
    const v: V3 = [(p3[0] - p0[0]) / 2, (p3[1] - p0[1]) / 2, (p3[2] - p0[2]) / 2];
    this.panel(c, u, v, glow, tag);
  }

  node(p: V3, r = 0.05, group = 0, tag = -1) {
    this.nodesList.push({ p, r: r * 0.5, group, tag });
  }

  private randomInBounds(): V3 {
    const { min, max } = this.bounds;
    return [
      min[0] + (max[0] - min[0]) * this.rng(),
      min[1] + (max[1] - min[1]) * this.rng(),
      min[2] + (max[2] - min[2]) * this.rng(),
    ];
  }

  finish(name: string): Form {
    if (
      process.env.NODE_ENV !== "production" &&
      (this.beamsList.length > COUNT.beams ||
        this.pathsList.length > COUNT.paths ||
        this.panelsList.length > COUNT.panels ||
        this.nodesList.length > COUNT.nodes)
    ) {
      console.warn(
        `[form:${name}] over budget`,
        this.beamsList.length,
        this.pathsList.length,
        this.panelsList.length,
        this.nodesList.length,
      );
    }

    // Unused instances collapse to a hidden point inside the form.
    while (this.beamsList.length < COUNT.beams) {
      const p = this.randomInBounds();
      this.beamsList.push({ a: p, b: p, t: 0, h: 0, group: 255, tag: -1 });
    }
    // Sorting by height keeps morphs orderly: parts move as bands, not as a swarm crossing itself.
    const midY = (r: BeamRecord) => r.a[1] + r.b[1];
    const beamList = this.beamsList.slice(0, COUNT.beams).sort((x, y) => midY(x) - midY(y));

    const beams = new Float32Array(COUNT.beams * STRIDE.beams);
    const beamGroups = new Uint8Array(COUNT.beams);
    const beamTags = new Int16Array(COUNT.beams);
    beamList.forEach((r, i) => {
      beams.set([...r.a, ...r.b, r.t, r.h], i * STRIDE.beams);
      beamGroups[i] = r.group;
      beamTags[i] = r.tag;
    });

    const paths = new Float32Array(COUNT.paths * STRIDE.paths);
    const pathTags = new Int16Array(COUNT.paths).fill(-1);
    for (let i = 0; i < COUNT.paths; i++) {
      const r = this.pathsList[i];
      if (r) {
        paths.set([...r.a, ...r.b, r.phase], i * STRIDE.paths);
        pathTags[i] = r.tag;
      } else {
        const p = this.randomInBounds();
        paths.set([...p, ...p, 0], i * STRIDE.paths);
      }
    }

    const panels = new Float32Array(COUNT.panels * STRIDE.panels);
    const panelTags = new Int16Array(COUNT.panels).fill(-1);
    for (let i = 0; i < COUNT.panels; i++) {
      const r = this.panelsList[i];
      if (r) {
        panels.set([...r.c, ...r.u, ...r.v, r.glow], i * STRIDE.panels);
        panelTags[i] = r.tag;
      } else {
        const p = this.randomInBounds();
        panels.set([...p, 0, 0, 0, 0, 0, 0, 0], i * STRIDE.panels);
      }
    }

    const nodes = new Float32Array(COUNT.nodes * STRIDE.nodes);
    const nodeGroups = new Uint8Array(COUNT.nodes);
    const nodeTags = new Int16Array(COUNT.nodes).fill(-1);
    for (let i = 0; i < COUNT.nodes; i++) {
      const r = this.nodesList[i];
      if (r) {
        nodes.set([...r.p, r.r], i * STRIDE.nodes);
        nodeGroups[i] = r.group;
        nodeTags[i] = r.tag;
      } else {
        const p = this.randomInBounds();
        nodes.set([...p, 0], i * STRIDE.nodes);
        nodeGroups[i] = 255;
      }
    }

    return { beams, beamGroups, beamTags, paths, pathTags, panels, panelTags, nodes, nodeGroups, nodeTags };
  }
}

/** Phase at or above this means the path holds a steady line and never carries a pulse. */
const QUIET = 10;

const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const along = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The laptop: a machined base with a keyboard and trackpad, and a tilted lid. The code on its screen is `codeScreen.ts`. */
function laptopBody(b: FormBuilder, c: V3, s: number, group = 0) {
  const P = (x: number, y: number, z: number): V3 => [c[0] + x * s, c[1] + y * s, c[2] + z * s];
  const { width, depth, baseY, baseHeight, hinge, lidTop, lidThickness } = LAPTOP;
  const top = baseY + baseHeight / 2;

  b.block(P(0, baseY, 0), [width * s, baseHeight * s, depth * s], 0, group);
  b.slab(P(hinge[0], hinge[1], hinge[2]), P(lidTop[0], lidTop[1], lidTop[2]), width * s, lidThickness * s, group);
  b.block(P(0, top + 0.012, hinge[2] + 0.02), [1.1 * s, 0.05 * s, 0.1 * s], 0, group);

  // The keyboard: rows of real keys over a soft backlight.
  const keyW = 0.2;
  const rows = [-0.72, -0.48, -0.24, 0];
  b.panel(P(0, top + 0.004, -0.36), [1.42 * s, 0, 0], [0, 0, 0.5 * s], 0.2);
  rows.forEach((z) => {
    for (let k = 0; k < 12; k++) b.block(P((k - 5.5) * (keyW + 0.04), top + 0.02, z), [keyW * s, 0.036 * s, 0.19 * s], 0, group);
  });
  b.block(P(0, top + 0.02, 0.24), [1.2 * s, 0.036 * s, 0.19 * s], 0, group);
  [-1.2, -0.9, 0.9, 1.2].forEach((x) => b.block(P(x, top + 0.02, 0.24), [0.26 * s, 0.036 * s, 0.19 * s], 0, group));

  // The trackpad.
  const pad = { z: 0.73, w: 0.56, d: 0.24 };
  const padCorners: V3[] = [P(-pad.w, top + 0.006, pad.z - pad.d), P(pad.w, top + 0.006, pad.z - pad.d), P(pad.w, top + 0.006, pad.z + pad.d), P(-pad.w, top + 0.006, pad.z + pad.d)];
  b.polyline(padCorners, 0.012 * s, group, true);
  b.panel(P(0, top + 0.004, pad.z), [pad.w * s, 0, 0], [0, 0, pad.d * s], 0.06);

  // Light running along the hinge: this is where the work leaves the machine for everything around it.
  const hingeLeft = P(-width / 2 + 0.06, top + 0.012, hinge[2] + 0.1);
  const hingeRight = P(width / 2 - 0.06, top + 0.012, hinge[2] + 0.1);
  b.route([P(0, top + 0.012, hinge[2] + 0.1), hingeRight], 0.1, 0.06);
  b.route([P(0, top + 0.012, hinge[2] + 0.1), hingeLeft], 0.6, 0.06);
  b.node(P(width / 2 - 0.2, top + 0.01, depth / 2 - 0.12), 0.05, 1);
}

/** A thin floating surface, drawn as an interface: a frame, a header and blocks of layout. Never fake code. */
function interfacePanel(b: FormBuilder, c: V3, u: V3, v: V3, group: number, tag: number, kind: number) {
  const at = (x: number, y: number): V3 => [c[0] + u[0] * x + v[0] * y, c[1] + u[1] * x + v[1] * y, c[2] + u[2] * x + v[2] * y];
  b.panel(c, u, v, 0.1, tag);
  b.polyline([at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)], 0.022, group, true, tag);
  b.beam(at(-1, 0.72), at(1, 0.72), 0.008, group, tag);
  b.beam(at(-0.88, 0.86), at(-0.45, 0.86), 0.022, group, tag);
  if (kind === 0) {
    b.panel(at(-0.42, 0.04), [u[0] * 0.46, u[1] * 0.46, u[2] * 0.46], [v[0] * 0.5, v[1] * 0.5, v[2] * 0.5], 0.2, tag);
    [0.4, 0.14, -0.12].forEach((y, i) => b.beam(at(0.16, y), at(0.86 - i * 0.2, y), 0.016, group, tag));
    b.beam(at(0.16, -0.54), at(0.58, -0.54), 0.05, group, tag);
  } else if (kind === 1) {
    [-0.56, 0, 0.56].forEach((x) => {
      b.panel(at(x, -0.1), [u[0] * 0.22, u[1] * 0.22, u[2] * 0.22], [v[0] * 0.55, v[1] * 0.55, v[2] * 0.55], 0.14, tag);
    });
  } else {
    [0.42, 0.14, -0.14, -0.42].forEach((y, i) => {
      b.beam(at(-0.84, y), at(-0.6, y), 0.05, group, tag);
      b.beam(at(-0.46, y), at(0.84 - (i % 2) * 0.3, y), 0.014, group, tag);
    });
  }
}

/** One machined service: a block with a seam of light around it and a status node. */
function serviceModule(b: FormBuilder, c: V3, s: V3, yaw: number, group: number, tag: number) {
  b.block(plus(c, [0, s[1] * 0.27, 0]), [s[0], s[1] * 0.46, s[2]], yaw, group, tag);
  b.block(plus(c, [0, -s[1] * 0.27, 0]), [s[0], s[1] * 0.46, s[2]], yaw, group, tag);
  b.panel(c, [Math.cos(yaw) * s[0] * 0.46, 0, Math.sin(yaw) * s[0] * 0.46], [-Math.sin(yaw) * s[2] * 0.46, 0, Math.cos(yaw) * s[2] * 0.46], 0.8, tag);
  b.node(plus(c, [Math.cos(yaw) * s[0] * 0.3, 0, Math.sin(yaw) * s[0] * 0.3 + s[2] * 0.54]), 0.07, 1, tag);
}

/** A database: stacked discs, with the rows running through them. */
function databaseStack(b: FormBuilder, c: V3, r: number, group: number, tag: number, discs = 3) {
  for (let i = 0; i < discs; i++) {
    const y = c[1] + (i - (discs - 1) / 2) * r * 0.62;
    b.ring([c[0], y, c[2]], r, r * 0.3, r * 0.22, 10, group, tag);
    b.panel([c[0], y + r * 0.13, c[2]], [r * 0.86, 0, 0], [0, 0, r * 0.86], 0.34, tag);
    b.node([c[0] + r * 0.2, y + r * 0.2, c[2] + r * 1.08], 0.055, 1, tag);
  }
  const top = c[1] + ((discs - 1) / 2) * r * 0.62;
  const bottom = c[1] - ((discs - 1) / 2) * r * 0.62;
  b.route([[c[0], top + r * 0.2, c[2]], [c[0], c[1], c[2]], [c[0], bottom - r * 0.2, c[2]]], 0.1, 0.08, tag);
}

/** The hero: one full-stack application as a single floating machine, with a small network learning beside it. */
function buildCore(): Form {
  const b = new FormBuilder(11, { min: [-3, -3, -2], max: [3, 3, 2] });
  laptopBody(b, [0, 0, 0], 1);

  // Frontend: thin screens hanging in the air beside the laptop, tilted towards the viewer.
  const F = CORE.frontend;
  interfacePanel(b, plus(F, [-0.82, 0.1, -0.5]), [0.74, 0.02, 0.1], [0.04, 0.56, -0.2], 0, 0, 1);
  interfacePanel(b, plus(F, [0.25, 0.42, 0]), [0.82, 0, 0.04], [0, 0.6, -0.18], 0, 0, 0);
  interfacePanel(b, plus(F, [-0.3, -0.56, 0.75]), [0.62, -0.02, 0.12], [0.02, 0.42, -0.14], 0, 0, 2);
  const frontPort: V3 = [-LAPTOP.width / 2, LAPTOP.baseY, 0.1];
  const frontDown: V3 = plus(F, [0.25, -0.2, 0.05]);
  const frontBend: V3 = [frontPort[0], frontDown[1] - 0.6, frontPort[2]];
  b.beam(frontPort, frontBend, 0.03, 0, 1);
  b.beam(frontBend, frontDown, 0.03, 0, 1);
  b.route([frontDown, frontBend, frontPort], 0.2, 0.09, 1);
  b.route([frontPort, frontBend, frontDown], 0.7, 0.09, 1);
  b.route([plus(F, [-0.82, -0.46, -0.5]), plus(F, [-0.1, -0.5, -0.1]), frontDown], 0.45, 0.07, 0);
  b.route([plus(F, [-0.3, -0.14, 0.75]), frontDown], 0.1, 0.07, 0);

  // APIs: a gateway the backend's traffic passes through, and the bright routes joining everything.
  const G = CORE.gateway;
  const gate = (x: number, r: number): V3[] => Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [x, G[1] + Math.cos(a) * r, G[2] + Math.sin(a) * r] as V3;
  });
  b.polyline(gate(G[0], 0.5), 0.05, 0, true, 1);
  b.polyline(gate(G[0] + 0.14, 0.36), 0.016, 0, true, 1);
  [0, 2.09, 4.19].forEach((a) => b.node([G[0], G[1] + Math.cos(a) * 0.5, G[2] + Math.sin(a) * 0.5], 0.09, 1, 1));

  // Backend: services talking to each other.
  const B = CORE.backend;
  const services: { at: V3; s: V3 }[] = [
    { at: plus(B, [-0.1, 0.2, 0.05]), s: [0.98, 0.5, 0.74] },
    { at: plus(B, [0.55, 1.08, -0.35]), s: [0.72, 0.4, 0.56] },
    { at: plus(B, [0.5, -0.74, 0.3]), s: [0.76, 0.42, 0.6] },
    { at: plus(B, [-0.36, 1.0, 0.55]), s: [0.54, 0.34, 0.46] },
  ];
  services.forEach(({ at, s }) => serviceModule(b, at, s, 0.18, 0, 2));
  ([[0, 1], [0, 2], [0, 3], [1, 3]] as const).forEach(([p, q], n) => {
    b.beam(services[p].at, services[q].at, 0.022, 0, 2);
    b.route([services[p].at, along(services[p].at, services[q].at, 0.5), services[q].at], n * 0.22, 0.08, 2);
  });
  const backPort: V3 = [LAPTOP.width / 2, LAPTOP.baseY, 0];
  b.beam(backPort, services[0].at, 0.034, 0, 1);
  b.route([backPort, G, services[0].at], 0, 0.1, 1);
  b.route([services[0].at, plus(G, [0, 0.18, 0]), plus(backPort, [0, 0.18, 0])], 0.5, 0.1, 1);

  // Database: disc stacks and an index of small blocks, feeding the core from below.
  const D = CORE.database;
  databaseStack(b, plus(D, [-0.24, 0, 0]), 0.62, 0, 3);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const at: V3 = [D[0] + 0.72 + col * 0.26, D[1] - 0.26 + row * 0.26, D[2] + 0.18];
      b.block(at, [0.19, 0.16, 0.2], 0, 0, 3);
      if ((row + col) % 3 === 0) b.node(plus(at, [0, 0, 0.16]), 0.05, 1, 3);
    }
  }
  const dbTop: V3 = [D[0] - 0.24, D[1] + 0.66, D[2]];
  b.beam([0, LAPTOP.baseY - 0.05, 0], dbTop, 0.034, 0, 1);
  b.route([dbTop, [0, LAPTOP.baseY - 0.05, 0]], 0.3, 0.1, 1);
  b.route([[D[0] + 1.11, D[1] + 0.3, D[2] + 0.18], [0.55, LAPTOP.baseY - 0.05, 0.2]], 0.65, 0.1, 1);

  // A much smaller cluster to the side: the part still being learned.
  const A = CORE.ai;
  const layers: V3[][] = [
    [[-0.62, 0.42, 0], [-0.62, -0.02, 0.18], [-0.62, -0.46, 0]],
    [[0, 0.62, -0.1], [0, 0.2, 0.14], [0, -0.22, -0.14], [0, -0.64, 0.1]],
    [[0.62, 0.22, 0.05], [0.62, -0.24, -0.05]],
  ];
  const world = layers.map((l) => l.map((p) => plus(A, p)));
  world.forEach((l, li) => {
    l.forEach((p) => b.node(p, 0.1, li === 1 ? 0 : 1, 4));
    if (li === 0) return;
    world[li - 1].forEach((q) => l.forEach((p, n) => {
      b.beam(q, p, 0.0055, 0, 4);
      if (n % 2 === 0) b.path(q, p, QUIET, 4);
    }));
  });
  b.route([world[0][0], world[1][1], world[2][0]], 0.1, 0.1, 4);
  b.route([world[0][2], world[1][2], world[2][1]], 0.55, 0.1, 4);
  b.route([[0.9, LAPTOP.lidTop[1], LAPTOP.lidTop[2]], plus(A, [-0.62, -0.46, 0])], 0.3, 0.1, 1);

  return b.finish("core");
}

/**
 * About: the application from the hero, pulled apart along one axis, so each layer can be read by itself and the data can be seen
 * passing through all of them. Tags and groups are the layers, in stackLayers' order.
 */
function buildEcosystem(spread: number): Form {
  const b = new FormBuilder(23, { min: [-4, -3, -3], max: [4, 3, 3] });
  const X = (i: number) => layerX(i, spread);
  const techNode = (i: number, t: number, r = 0.13) => {
    const [y, z] = layerTech[i][t];
    b.node([X(i), y, z], r, 1, i);
  };

  // Frontend: one large translucent screen, with the frameworks on it.
  const x0 = X(0);
  interfacePanel(b, [x0, 0, 0], [0, 0, 1.25], [0, 1.02, 0], 0, 0, 0);
  [0, 1, 2].forEach((t) => techNode(0, t));

  // APIs and authentication: an open gateway the requests pass through.
  const x1 = X(1);
  const hoop = (x: number, r: number): V3[] => Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [x, Math.cos(a) * r, Math.sin(a) * r] as V3;
  });
  b.polyline(hoop(x1, 1.12), 0.09, 1, true, 1);
  b.polyline(hoop(x1 + 0.12, 0.8), 0.016, 1, true, 1);
  [0, 1, 2].forEach((t) => techNode(1, t));

  // Backend: machined services.
  const x2 = X(2);
  layerTech[2].forEach(([y, z]) => {
    b.block([x2, y, z], [0.5, 0.56, 1.02], 0, 2, 2);
    b.panel([x2 - 0.255, y, z], [0, 0, 0.42], [0, 0.19, 0], 0.24, 2);
  });
  [0, 1, 2].forEach((t) => {
    const [y, z] = layerTech[2][t];
    b.node([x2 - 0.3, y, z], 0.11, 1, 2);
    const [y2, z2] = layerTech[2][(t + 1) % 3];
    b.beam([x2, y, z], [x2, y2, z2], 0.026, 2, 2);
    b.route([[x2, y, z], [x2, (y + y2) / 2, (z + z2) / 2], [x2, y2, z2]], t * 0.3, 0.08, 2);
  });

  // Database: two stores, MongoDB and SQL.
  const x3 = X(3);
  layerTech[3].forEach(([y, z]) => {
    databaseStack(b, [x3, y - 0.72, z], 0.66, 3, 3);
    b.node([x3 - 0.7, y, z], 0.11, 1, 3);
    b.beam([x3, y - 0.72, z], [x3, y - 0.72, 0], 0.03, 3, 3);
  });
  b.block([x3, 0, 0], [0.32, 0.32, 0.32], 0, 3, 3);

  // The data passing through all of it, in both directions.
  const lanes: { y: number; z: number; phase: number; back?: boolean }[] = [
    { y: 0.2, z: -0.3, phase: 0 },
    { y: -0.25, z: 0.28, phase: 0.45, back: true },
    { y: 0.5, z: 0.12, phase: 0.72 },
  ];
  lanes.forEach(({ y, z, phase, back }) => {
    const pts: V3[] = [0, 1, 2, 3].map((i) => [X(i), y, z]);
    pts.slice(0, -1).forEach((p, n) => b.route(back ? [pts[n + 1], p] : [p, pts[n + 1]], phase + (back ? 2 - n : n) * 0.18, 0.12, n + 1));
    b.beam(pts[0], pts[3], 0.008, 5);
  });

  // Problem solving and system design: set apart, a decision tree with one route all the way through.
  const P = ECOSYSTEM.problem;
  const tree = (p: V3, depth: number, spreadY: number, lit: boolean) => {
    if (depth === 0) {
      b.node(p, lit ? 0.2 : 0.08, lit ? 1 : 0, 4);
      return;
    }
    b.node(p, lit ? 0.12 : 0.07, 0, 4);
    const up: V3 = [p[0] + 0.62, p[1] + spreadY, p[2] - 0.04];
    const down: V3 = [p[0] + 0.62, p[1] - spreadY, p[2] + 0.04];
    b.beam(p, up, 0.012, 4, 4);
    b.beam(p, down, 0.012, 4, 4);
    if (lit) b.path(p, down, (3 - depth) * 0.14, 4);
    tree(up, depth - 1, spreadY * 0.5, false);
    tree(down, depth - 1, spreadY * 0.5, lit);
  };
  tree(plus(P, [-0.95, 0.1, 0]), 3, 0.5, true);

  return b.finish(`ecosystem-${spread}`);
}

/**
 * BloodLink, acting out its request flow. Tags are the steps: 0 search by location, 1 send a request, 2 donor accepts,
 * 3 chat opens. Node groups: 0 donors, 1 patients, 2 blood banks. The frames beneath it are the real search
 * hierarchy, nested down to the patient's city.
 */
function buildBloodLink(): Form {
  const b = new FormBuilder(37, { min: [-3, -2, -3], max: [3, 2, 3] });
  const { patient, donor, ground } = BLOOD;
  const banks: V3[] = [
    [-2.4, 1.2, -1.2],
    [0.6, -0.5, -1.7],
    [0.1, 1.2, 1.6],
    [-0.4, -1.1, 1.8],
    [2.7, -0.5, 1.2],
  ];
  const others: V3[] = [
    [0.8, 0.2, 0.2],
    [1.3, -1.0, 1.4],
    [0.2, 1.6, -1.3],
    [2.8, 0.9, 0.5],
    [-1.3, 1.5, -1.9],
  ];
  const dist = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const nearest = (p: V3, set: readonly V3[], n: number) =>
    [...set].sort((x, y) => dist(p, x) - dist(p, y)).slice(0, n);

  // Search: the location narrows frame by frame until it reaches the patient's city.
  BLOOD.frames.forEach(({ t, r }, n) => {
    const [cx, cz] = bloodFrame(t);
    const corners: V3[] = [
      [cx - r, ground, cz - r],
      [cx + r, ground, cz - r],
      [cx + r, ground, cz + r],
      [cx - r, ground, cz + r],
    ];
    b.polyline(corners, 0.008 + n * 0.003, 3, true, 0);
    b.route([...corners, corners[0]], n * 0.2, 0.05, 0);
  });
  const below: V3 = [patient[0], ground, patient[2]];
  b.beam(below, patient, 0.012, 3, 0);
  b.route([below, patient], 0.8, 0.05, 0);

  // Donors the search finds, standing inside the city frame.
  const nearby: V3[] = [
    [patient[0] - 0.45, -0.5, patient[2] - 0.35],
    [patient[0] + 0.5, -0.1, patient[2] - 0.45],
    [patient[0] + 0.3, -0.9, patient[2] + 0.5],
    [patient[0] - 0.5, 0.0, patient[2] + 0.4],
  ];
  nearby.forEach((d, i) => {
    b.node(d, 0.07, 0, 0);
    b.beam([d[0], ground, d[2]], d, 0.005, 0, 0);
    b.route([below, d], 0.9 + i * 0.06, 0.05, 0);
  });

  // The request travels out to one donor.
  const out = arc(patient, donor, 1.0, 8);
  b.polyline(out, 0.012, 1, false, 1);
  b.route(out, 0, 0.04, 1);

  // The donor accepts: a ring closes around them and the answer travels back.
  const ring: V3[] = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [donor[0] + Math.cos(a) * 0.38, donor[1] + Math.sin(a) * 0.38, donor[2]];
  });
  b.polyline(ring, 0.012, 0, true, 2);
  const back = arc(donor, patient, 1.55, 8);
  b.polyline(back, 0.012, 0, false, 2);
  b.route(back, 0, 0.04, 2);

  // The chat opens: a direct two-way line, with messages along it.
  const lineA = arc(patient, donor, 0.15, 6, 0.05);
  const lineB = arc(donor, patient, 0.15, 6, 0.05);
  b.polyline(lineA, 0.016, 1, false, 3);
  b.route(lineA, 0, 0.04, 3);
  b.route(lineB, 0.5, 0.04, 3);
  [0.25, 0.5, 0.75].forEach((t, i) => {
    const x = patient[0] + (donor[0] - patient[0]) * t;
    const z = patient[2] + (donor[2] - patient[2]) * t;
    const y = patient[1] + (donor[1] - patient[1]) * t + 0.42 + (i % 2) * 0.1;
    const w = 0.34 - (i % 2) * 0.08;
    b.panel([x, y, z], [w, 0, 0], [0, 0.14, 0], 0, 3);
    b.polyline(
      [
        [x - w, y - 0.14, z],
        [x + w, y - 0.14, z],
        [x + w, y + 0.14, z],
        [x - w, y + 0.14, z],
      ],
      0.006,
      1,
      true,
      3,
    );
  });

  // Everyone else on the network, quieter.
  b.node(patient, 0.2, 1);
  b.node(donor, 0.15, 0, 2);
  const field: V3[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 * 3.1 + b.random() * 0.5;
    const r = 1.4 + b.random() * 2.2;
    field.push([Math.cos(a) * r, -1.2 + b.random() * 2.7, Math.sin(a) * r * 0.86]);
  }
  field.forEach((d, i) => {
    b.node(d, 0.045 + b.random() * 0.02, 0);
    const [t] = nearest(d, i % 3 === 0 ? others : banks, 1);
    b.beam(d, t, 0.006, 0);
    if (i % 4 === 1) {
      const [other] = nearest(d, field.slice(0, i), 1);
      if (other) b.beam(d, other, 0.0035, 0);
    }
  });
  others.forEach((p, i) => {
    b.node(p, 0.11, 1);
    nearest(p, banks, 2).forEach((bank, j) => {
      b.beam(p, bank, 0.009, 1);
      const mid: V3 = [(p[0] + bank[0]) / 2, (p[1] + bank[1]) / 2, (p[2] + bank[2]) / 2];
      b.route([bank, mid, p], i * 0.14 + j * 0.3, 0.1);
    });
  });
  banks.forEach((p, i) => {
    // A blood bank holds stock, so it is the one solid thing on the network.
    b.block(plus(p, [0, 0.11, 0]), [0.42, 0.16, 0.42], 0.5, 2);
    b.block(plus(p, [0, -0.11, 0]), [0.42, 0.16, 0.42], 0.5, 2);
    b.node(plus(p, [0, 0, 0.26]), 0.14, 2);
    const [next] = nearest(p, banks.filter((_, j) => j !== i), 1);
    b.beam(p, next, 0.014, 2);
  });

  return b.finish("bloodlink");
}

/**
 * ProLink, acting out the three things its users do. Tags: 0 publish a post, 1 likes and comments, 2 connect.
 * The author and the post are in front, with readers on the layers behind.
 */
function buildProLink(): Form {
  const b = new FormBuilder(53, { min: [-4, -2.4, -3], max: [4, 2.4, 3] });
  const card = (c: V3, w: number, h: number, group: number, tag: number, lines: number) => {
    const [x, y, z] = c;
    b.polyline(
      [
        [x - w, y - h, z],
        [x + w, y - h, z],
        [x + w, y + h, z],
        [x - w, y + h, z],
      ],
      0.012,
      group,
      true,
      tag,
    );
    b.panel(c, [w, 0, 0], [0, h, 0], 0, tag);
    for (let r = 0; r < lines; r++) {
      const ly = y + h * 0.1 - h * (0.1 + r * 0.3);
      b.beam([x - w * 0.82, ly, z], [x + w * (0.82 - r * 0.24), ly, z], 0.005, group, tag);
    }
  };
  const profile = (c: V3, w: number, h: number, group: number, tag: number, lines: number) => {
    card(c, w, h, group, tag, lines);
    const av = avatarOf({ c, w, h });
    b.beam([c[0] - w * 0.3, c[1] + h * 0.52, c[2]], [c[0] + w * 0.7, c[1] + h * 0.52, c[2]], 0.012, group, tag);
    return av;
  };

  // Publish: the author writes, and the post appears.
  const { author, post, comments, like, readers, readerSize } = PRO;
  const authorAv = profile(author.c, author.w, author.h, 0, -1, 2);
  b.node(authorAv, 0.17, 0);
  card(post.c, post.w, post.h, 0, 0, 3);
  b.panel(
    [post.c[0], post.c[1] + post.h * 0.45, post.c[2] + 0.01],
    [post.w * 0.82, 0, 0],
    [0, post.h * 0.4, 0],
    0,
    0,
  );
  const postIn: V3 = [post.c[0] - post.w, post.c[1], post.c[2]];
  const publish = arc(authorAv, postIn, 0.3, 4);
  b.polyline(publish, 0.008, 3, false, 0);
  b.route(publish, 0, 0.05, 0);

  // Readers respond: the first four like the post, the next two leave comments.
  const readerAvs = readers.map(({ c }, i) => {
    const av = profile(c, readerSize.w, readerSize.h, i < 3 ? 1 : 2, -1, 2);
    b.node(av, 0.12, i < 3 ? 1 : 2, i < 6 ? 1 : -1);
    return av;
  });
  b.node(like, 0.13, 3, 1);
  readerAvs.slice(0, 4).forEach((av, i) => {
    const pts = arc(av, like, 0.3, 3);
    b.polyline(pts, 0.005, 3, false, 1);
    b.route(pts, i * 0.2, 0.06, 1);
  });
  comments.forEach(({ c, w, h }, i) => {
    card(c, w, h, 0, 1, 1);
    const av = readerAvs[4 + i];
    const to: V3 = [c[0] + w, c[1], c[2]];
    const pts = arc(av, to, 0.25, 3);
    b.polyline(pts, 0.005, 3, false, 1);
    b.route(pts, 0.1 + i * 0.25, 0.06, 1);
    b.beam([post.c[0], post.c[1] - post.h, post.c[2]], [c[0], c[1] + h, c[2]], 0.005, 3, 1);
  });

  // Connect: one reader and the author link up directly.
  const connect = arc(readerAvs[0], authorAv, 1.5, 10);
  const connectBack = arc(readerAvs[0], authorAv, 1.58, 10);
  b.polyline(connect, 0.014, 3, false, 2);
  b.polyline(connectBack, 0.006, 3, false, 2);
  b.route(connect, 0, 0.03, 2);
  b.route(connectBack.slice().reverse(), 0.5, 0.03, 2);
  b.node(authorAv, 0.28, 3, 2);
  b.node(readerAvs[0], 0.24, 3, 2);

  return b.finish("prolink");
}

/**
 * Wanderlust: three houses built from the three real listing photographs, each lighting with its picture. Tags are the
 * listings. The quieter houses further down the lane stand in for the rest of the listings page.
 */
function buildWanderlust(): Form {
  const b = new FormBuilder(71, { min: [-5, -1.5, -14], max: [5, 2, 3] });
  const lanePts: V3[] = [];
  for (let i = 0; i <= 34; i++) {
    const z = 3 - (i / 34) * 17;
    const x = lane(z);
    lanePts.push([x, terrain(x, z) + 0.02, z]);
  }
  b.route(lanePts, 0, 0.028);

  const gable = (x: number, y: number, z: number, w: number, h: number, roof: number, t: number, tag = -1) => {
    const pts: V3[] = [
      [x - w, y, z],
      [x - w, y + h, z],
      [x, y + roof, z],
      [x + w, y + h, z],
      [x + w, y, z],
    ];
    b.polyline(pts, t, 0, true, tag);
    return pts;
  };
  const house = (x: number, y: number, z: number, w: number, d: number, h: number, roof: number, t: number, tag = -1) => {
    const front = gable(x, y, z + d, w, h, roof, t, tag);
    const back = gable(x, y, z - d, w, h, roof, t, tag);
    for (let c = 0; c < 5; c++) b.beam(front[c], back[c], t * 0.7, 0, tag);
  };

  // The lakeside house: long and low, on a plinth at the water's edge.
  {
    const [x, y, z] = listingAt(listings[0]);
    house(x, y + 0.12, z, 0.8, 0.42, 0.42, 0.78, 0.016, 0);
    b.box([x, y + 0.06, z], [1.8, 0.12, 1.0], 0.012, 0, 0);
    [-0.45, 0, 0.45].forEach((dx) => {
      b.panel([x + dx, y + 0.34, z + 0.43], [0.15, 0, 0], [0, 0.16, 0], 0.35, 0);
      b.node([x + dx, y + 0.34, z + 0.45], 0.07, 1, 0);
    });
    // The lake, with the house's lights drawn across it.
    b.panel([x, y + 0.01, z + 1.0], [1.1, 0, 0], [0, 0, 0.42], 0, 0);
    [-0.45, 0, 0.45].forEach((dx, i) => b.route([[x + dx, y + 0.02, z + 0.6], [x + dx, y + 0.02, z + 1.42]], i * 0.2, 0.05, 0));
  }

  // The timber cabin: a steep A-frame, its one tall window lit against the snow.
  {
    const [x, y, z] = listingAt(listings[1]);
    const front = gable(x, y, z + 0.5, 0.62, 0.02, 1.38, 0.018, 1);
    const back = gable(x, y, z - 0.5, 0.62, 0.02, 1.38, 0.018, 1);
    for (let c = 0; c < 5; c++) b.beam(front[c], back[c], 0.012, 0, 1);
    for (let i = 1; i < 5; i++) {
      const k = i / 5;
      const yy = y + k * 1.38;
      const ww = 0.62 * (1 - k);
      b.beam([x - ww, yy, z + 0.5], [x - ww, yy, z - 0.5], 0.005, 0, 1);
      b.beam([x + ww, yy, z + 0.5], [x + ww, yy, z - 0.5], 0.005, 0, 1);
    }
    b.panel([x, y + 0.42, z + 0.5], [0.2, 0, 0], [0, 0.38, 0], 0.4, 1);
    b.node([x, y + 0.42, z + 0.53], 0.1, 1, 1);
    const snow: V3[] = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return [x + Math.cos(a) * 1.05, y + 0.01, z + Math.sin(a) * 1.05];
    });
    b.polyline(snow, 0.005, 0, true, 1);
    b.route([...snow, snow[0]], 0, 0.02, 1);
  }

  // The villa: flat slabs stacked by the sea, with its infinity pool running off the edge.
  {
    const [x, y, z] = listingAt(listings[2]);
    b.box([x, y + 0.24, z], [1.9, 0.48, 1.0], 0.016, 0, 2);
    b.box([x - 0.25, y + 0.72, z], [1.1, 0.42, 0.8], 0.014, 0, 2);
    b.beam([x - 1.15, y + 0.5, z + 0.6], [x + 1.15, y + 0.5, z + 0.6], 0.016, 0, 2);
    [-0.6, 0, 0.6].forEach((dx) => {
      b.panel([x + dx, y + 0.24, z + 0.5], [0.24, 0, 0], [0, 0.16, 0], 0.35, 2);
      b.node([x + dx, y + 0.24, z + 0.52], 0.07, 1, 2);
    });
    b.panel([x + 0.1, y + 0.02, z + 1.05], [1.2, 0, 0], [0, 0, 0.3], 0, 2);
    const rim: V3[] = [
      [x - 1.1, y + 0.02, z + 0.75],
      [x + 1.3, y + 0.02, z + 0.75],
      [x + 1.3, y + 0.02, z + 1.35],
      [x - 1.1, y + 0.02, z + 1.35],
    ];
    b.polyline(rim, 0.008, 0, true, 2);
    b.route([...rim, rim[0]], 0, 0.06, 2);
  }

  // The rest of the listings page, receding down the lane.
  const houses = 14;
  for (let i = 0; i < houses; i++) {
    const z = -6.6 - (i / (houses - 1)) * 7.4;
    const side = i % 2 === 0 ? 1 : -1;
    const x = lane(z) + side * (1.4 + b.random() * 1.8);
    const y = terrain(x, z);
    const w = 0.42 + b.random() * 0.24;
    const d = 0.5 + b.random() * 0.4;
    const h = 0.42 + b.random() * 0.36;
    house(x, y, z, w, d, h, h + 0.26 + b.random() * 0.2, 0.011);
    if (i < 10) b.panel([x, y + h * 0.5, z + d], [w * 0.26, 0, 0], [0, h * 0.26, 0], 1);
    b.node([x, y + h * 0.5, z + d + 0.04], 0.05, 1);
  }
  return b.finish("wanderlust");
}

/**
 * Experience: a career drawn like version history. A conceptual graph, not a real repository. Groups: 0 the main line,
 * 1 the Prejest-HR branch, 2 the Thought-Flow Media work. The poses clip it bottom-up, so scrolling draws it.
 */
function buildGitGraph(): Form {
  const b = new FormBuilder(83, { min: [-3, -3.6, -2], max: [3, 3.8, 2] });
  const { start, prejestFork, leave, attendance, merge, thoughtflow, now, teams } = GIT;
  const rail = (a: V3, c: V3, group: number, phase = 0, t = 0.09) => {
    b.beam(a, c, t, group);
    b.route([a, along(a, c, 0.5), c], phase, 0.1);
  };
  const curve = (a: V3, c: V3, group: number, phase = 0) => {
    const pts: V3[] = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const e = t * t * (3 - 2 * t);
      return [a[0] + (c[0] - a[0]) * e, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * e] as V3;
    });
    b.polyline(pts, 0.065, group);
    b.route(pts, phase, 0.05);
  };
  const commit = (at: V3, r: number, group: number) => {
    b.ring(at, r, r * 0.34, r * 0.32, 8, group);
    b.block(at, [r * 0.72, r * 0.26, r * 0.72], Math.PI / 4, group);
    b.node(plus(at, [0, r * 0.3, 0]), r * 0.68, group);
  };

  // The main line.
  const mainAt = (y: number): V3 => [0, y, 0];
  rail(mainAt(GIT.bottom), mainAt(prejestFork), 0, 0);
  rail(mainAt(prejestFork), mainAt(merge), 0, 0.2);
  rail(mainAt(merge), mainAt(thoughtflow), 1, 0.4);
  rail(mainAt(thoughtflow), mainAt(now), 2, 0.55);
  commit(mainAt(start), 0.24, 0);

  // Prejest-HR: a branch with two commits, merged back when the internship ended.
  commit(mainAt(prejestFork), 0.38, 1);
  curve(mainAt(prejestFork), leave, 1, 0.1);
  rail(leave, attendance, 1, 0.3, 0.065);
  curve(attendance, mainAt(merge), 1, 0.4);
  commit(leave, 0.3, 1);
  commit(attendance, 0.3, 1);
  commit(mainAt(merge), 0.26, 1);

  // Thought-Flow Media: the current head, with the three teams it coordinates branching beside it.
  commit(mainAt(thoughtflow), 0.42, 2);
  teams.forEach(({ at }, i) => {
    curve(mainAt(at[1] - 0.33), at, 2, 0.55 + i * 0.12);
    curve(at, mainAt(at[1] + 0.33), 2, 0.75 + i * 0.12);
    commit(at, 0.22, 2);
  });
  commit(mainAt(now), 0.34, 2);
  // Head is still moving: the line runs on past the last commit.
  b.beam(mainAt(now), mainAt(GIT.top), 0.02, 2);
  b.route([mainAt(now), mainAt(GIT.top)], 0.9, 0.08);

  return b.finish("gitgraph");
}

/** Skills: clusters of real technologies, joined by how they are actually used together. Tags come from layouts.ts. */
function buildConstellation(): Form {
  const b = new FormBuilder(89, { min: [-5, -3, -3], max: [5.5, 3, 2] });
  const byId = new Map(skillLayout.map((s) => [s.id, s]));

  clusters.forEach((cluster) => {
    const { c, r } = clusterLayout[cluster.id];
    const emerging = !!cluster.emerging;
    const group = emerging ? 1 : 0;

    // A small machined hub at the middle of each cluster. The one still being learned is drawn open and dashed.
    if (emerging) {
      b.ring(c, 0.24, 0.05, 0.05, 8, group);
    } else {
      b.block(c, [0.42, 0.1, 0.42], Math.PI / 4, group);
      b.ring(c, 0.3, 0.05, 0.04, 8, group);
    }
    b.node(c, 0.12, emerging ? 1 : 4);

    const ring: V3[] = Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return [c[0] + Math.cos(a) * r * 1.2, c[1] + Math.sin(a) * r * 0.92, c[2] + Math.sin(a * 2) * 0.28];
    });
    ring.forEach((p, i) => {
      if (emerging && i % 2 === 0) return;
      b.beam(p, ring[(i + 1) % ring.length], 0.006, group);
    });
  });

  skillLayout.forEach((s, t) => {
    b.node(s.position, 0.1, clusters.find((c) => c.id === s.cluster)?.emerging ? 1 : 3, t);
    const { c } = clusterLayout[s.cluster];
    b.beam(c, s.position, 0.008, 0, t);
    b.route([c, s.position], t / 21, 0.2, t);
  });

  skillLinks.forEach(([from, to], i) => {
    const P = byId.get(from);
    const Q = byId.get(to);
    if (!P || !Q) return;
    const tag = skillLinkTag(i);
    const A = P.position;
    const B = Q.position;
    const lift = 0.35 + (i % 3) * 0.12;
    const m1: V3 = [A[0] + (B[0] - A[0]) * 0.33, A[1] + (B[1] - A[1]) * 0.33, A[2] + (B[2] - A[2]) * 0.33 + lift];
    const m2: V3 = [A[0] + (B[0] - A[0]) * 0.66, A[1] + (B[1] - A[1]) * 0.66, A[2] + (B[2] - A[2]) * 0.66 + lift];
    b.polyline([A, m1, m2, B], 0.007, 0, false, tag);
    b.route([A, m1, m2, B], QUIET, 0.1, tag);
  });

  return b.finish("constellation");
}

/**
 * AI and ML: input, hidden and output layers, thin and orderly. Only a few routes carry a signal at any time. Every
 * connection also has a quiet line of its own, so hovering a neuron can light exactly the ones it touches.
 */
function buildNeural(collapse = 1): Form {
  const b = new FormBuilder(97, { min: [-4, -3, -2], max: [4, 3, 2] });
  const at = (p: V3): V3 => [p[0] * collapse, p[1] * collapse, p[2] * collapse];
  neurons.forEach((n, i) => b.node(at(n.at), n.layer === 0 ? 0.26 : n.layer === 3 ? 0.26 : 0.22, n.layer === 0 ? 1 : n.layer === 3 ? 2 : 0, i));

  synapses.forEach(([p, q], s) => {
    const A = at(neurons[p].at);
    const B = at(neurons[q].at);
    b.beam(A, B, 0.006, 0, synapseTag(s));
    b.path(A, B, QUIET, synapseTag(s));
  });

  // Each layer rests in a fine ring, which is what shows the depth once the camera moves.
  [0, 1, 2, 3].forEach((l) => {
    const { x, r, depth } = neuralRing(l);
    const pts: V3[] = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return at([x, Math.sin(a) * r, Math.cos(a) * r * depth]);
    });
    b.polyline(pts, 0.011, 1, true);
  });

  // The few signals that travel: start to finish, so a pulse can be followed all the way across.
  const byLayer = [0, 1, 2, 3].map((l) => neurons.flatMap((n, i) => (n.layer === l ? [i] : [])));
  [0, 1, 2, 3, 5].forEach((a, i) => {
    const hops = byLayer.map((ids, l) => at(neurons[ids[(a * (l + 2)) % ids.length]].at));
    b.route(hops, i * 0.19, 0.2);
  });

  return b.finish("neural");
}

/**
 * Achievements: a processor with its layers lifted apart. Package and pins, a die with traces running out to them,
 * three plates of code each turned a little further than the last, and a small network crowning them. The two
 * achievements orbit it on tagged threads: code brackets for the hackathon, and an app window sending outward for the
 * product presented to an audience.
 */
function buildMilestones(): Form {
  const b = new FormBuilder(101, { min: [-6, -3, -3], max: [6, 3.4, 3] });
  const { bowl, sides, star, technovate: T, policy: P } = MILESTONE;
  const around = (r: number, y: number, i: number, count: number = sides): V3 => {
    const a = (i / count) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };

  // The plinth: three machined steps, each a solid disc with a bright edge.
  [[1.5, -2.6, 0.22], [1.15, -2.31, 0.2], [0.8, -2.08, 0.14]].forEach(([r, y, h], step) => {
    for (let q = 0; q < 12; q++) b.block([0, y, 0], [r * 1.38, h, r * 1.38], (q * Math.PI) / 24);
    b.ring([0, y + h / 2, 0], r, 0.018, 0.018, 16);
    if (step === 0) {
      const edge = Array.from({ length: 17 }, (_, i) => around(r, y + h / 2 + 0.02, i, 16));
      b.route(edge, 0, 0.06);
      for (let i = 0; i < 8; i++) b.node(around(r, y + h / 2 + 0.02, i * 2, 16), 0.05);
    }
  });

  // The stem, turned, with a knot halfway up.
  const stem = [[0.24, -2.0], [0.15, -1.62], [0.32, -1.36], [0.15, -1.1], [0.22, -0.86], [0.5, -0.62]] as const;
  stem.slice(0, -1).forEach(([r, y], i) => b.beam([0, y, 0], [0, stem[i + 1][1], 0], r + stem[i + 1][0] * 0.6));
  stem.forEach(([r, y]) => {
    b.polyline(Array.from({ length: 8 }, (_, i) => around(r + 0.02, y, i, 8)), 0.014, 0, true);
  });

  // The bowl: glass over a fine frame, heavier at the rim.
  for (let i = 0; i < sides; i++) {
    ([[1, 3, 0.1], [3, 5, 0.2]] as const).forEach(([lo, hi, glow]) => {
      b.quad(around(bowl[lo][0], bowl[lo][1], i), around(bowl[lo][0], bowl[lo][1], i + 1), around(bowl[hi][0], bowl[hi][1], i + 1), around(bowl[hi][0], bowl[hi][1], i), glow);
    });
    const line = bowl.map(([r, y]) => around(r, y, i));
    b.polyline(line, 0.012);
    if (i % 2 === 0) b.route(line, i * 0.07, 0.07);
    b.node(around(1.68, 1.54, i), 0.06);
  }
  bowl.slice(1, -1).forEach(([r, y]) => b.polyline(Array.from({ length: sides }, (_, i) => around(r, y, i)), 0.012, 0, true));
  b.ring([0, 1.54, 0], 1.68, 0.07, 0.07, sides);
  b.route(Array.from({ length: sides + 1 }, (_, i) => around(1.7, 1.6, i)), 0, 0.04);

  // Handles: a pair of angle brackets, so the cup stands between them as code does. A finer line runs inside each.
  [-1, 1].forEach((side) => {
    const bracket = (inset: number): V3[] => [
      [side * (1.66 - inset * 0.2), 1.34 - inset, 0],
      [side * (2.78 - inset), 0.6, 0],
      [side * (1.36 - inset * 0.2), -0.14 + inset, 0],
    ];
    const outer = bracket(0);
    b.polyline(outer, 0.13);
    b.polyline(bracket(0.3), 0.022);
    b.route(outer, side > 0 ? 0.1 : 0.4, 0.12);
    b.node(outer[1], 0.16, 1);
    b.node(outer[0], 0.08);
    b.node(outer[2], 0.08);
  });

  // Light rising out of the bowl to the star.
  b.node([0, 0.7, 0], 0.5, 1);
  b.route([[0, 0.7, 0], [0, 1.3, 0], [0, star[1] - 0.45, 0]], 0.1, 0.12);

  // The star: solid and glowing, with rays that pulse outward.
  const point = (i: number, r: number): V3 => {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    return [star[0] + Math.cos(a) * r, star[1] + Math.sin(a) * r, star[2]];
  };
  const OUTER = 0.58;
  const INNER = 0.25;
  for (let i = 0; i < 5; i++) b.quad(star, point(i * 2 - 1, INNER), point(i * 2, OUTER), point(i * 2 + 1, INNER), 0.9);
  b.polyline(Array.from({ length: 10 }, (_, i) => point(i, i % 2 ? INNER : OUTER)), 0.03, 0, true);
  b.node(star, 0.14, 1);
  for (let i = 0; i < 10; i++) b.path(point(i, OUTER * 1.25), point(i, i % 2 ? OUTER * 1.7 : OUTER * 2.15), i * 0.1);

  // The laurel around it: a stem each side, its leaves in pairs, smaller towards the top.
  const R = 3.34;
  const centre = 0.2;
  [-1, 1].forEach((side) => {
    const stations = Array.from({ length: 12 }, (_, i) => {
      const a = (-82 + (i / 11) * 142) * (Math.PI / 180);
      return { a, p: [side * Math.cos(a) * R, centre + Math.sin(a) * R, -0.7] as V3 };
    });
    const line = stations.map((s) => s.p);
    b.polyline(line, 0.03);
    b.route(line, side > 0 ? 0 : 0.5, 0.06);
    stations.forEach(({ a, p }, i) => {
      const length = 0.6 - i * 0.022;
      const along: V3 = [-side * Math.sin(a), Math.cos(a), 0];
      const out: V3 = [side * Math.cos(a), Math.sin(a), 0];
      [-1, 1].forEach((face) => {
        const k = face * 0.46;
        b.beam(p, [p[0] + (along[0] + out[0] * k) * length, p[1] + (along[1] + out[1] * k) * length, p[2]], 0.105);
      });
      if (i % 2 === 0) b.node([p[0] + out[0] * 0.2, p[1] + out[1] * 0.2, p[2]], 0.07, 1);
    });
  });

  // Sparks in the air around it.
  for (let i = 0; i < 26; i++) {
    const a = b.random() * Math.PI * 2;
    const r = 1.9 + b.random() * 2.2;
    b.node([Math.cos(a) * r, -1 + b.random() * 4.4, Math.sin(a) * r * 0.5], 0.035 + b.random() * 0.05, b.random() > 0.6 ? 1 : 0);
  }

  // First prize: a medal with a one between code brackets, on its ribbons. Its thread runs to the trophy's handle.
  const onT = (x: number, y: number): V3 => [T[0] + x, T[1] + y, T[2]];
  const rim = (r: number, count: number) => Array.from({ length: count }, (_, i) => onT(Math.cos((i / count) * Math.PI * 2) * r, Math.sin((i / count) * Math.PI * 2) * r));
  b.polyline(rim(1.02, 22), 0.045, 1, true, 0);
  b.polyline(rim(0.88, 18), 0.01, 1, true, 0);
  b.route([...rim(1.02, 22), onT(1.02, 0)], 0, 0.02, 0);
  [-1, 1].forEach((side) => {
    const tail = [onT(side * 0.12, -0.98), onT(side * 0.5, -0.92), onT(side * 0.78, -1.98), onT(side * 0.56, -1.76), onT(side * 0.36, -2.06)];
    b.polyline(tail, 0.022, 1, true, 0);
    b.quad(tail[0], tail[1], onT(side * 0.66, -1.9), onT(side * 0.4, -1.98), 0.35, 0);
  });
  const curly = (cx: number, dir: number): V3[] =>
    ([[0.15, 0.46], [0, 0.38], [0, 0.08], [-0.15, 0], [0, -0.08], [0, -0.38], [0.15, -0.46]] as const).map(([x, y]) => onT(cx + dir * x, y));
  b.polyline(curly(-0.5, 1), 0.04, 1, false, 0);
  b.polyline(curly(0.5, -1), 0.04, 1, false, 0);
  b.polyline([onT(-0.13, 0.26), onT(0.02, 0.44), onT(0.02, -0.42)], 0.07, 1, false, 0);
  b.beam(onT(-0.16, -0.44), onT(0.2, -0.44), 0.06, 1, 0);
  const threadA: V3[] = [onT(1.02, -0.1), [-3.6, T[1] - 0.1, 0.3], [-2.78, 0.6, 0]];
  b.polyline(threadA, 0.01, 1, false, 0);
  b.route(threadA, 0.2, 0.08, 0);
  b.node(threadA[2], 0.09, 1, 0);

  // Presented: the product itself on a screen, sending outward in widening arcs. Its thread runs to the other handle.
  interfacePanel(b, P, [0.95, 0, -0.1], [0, 0.64, 0.04], 1, 1, 0);
  [0.36, 0.66, 0.96].forEach((r, k) => {
    const pts: V3[] = Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 2 + (i / 5 - 0.5) * 1.3;
      return [P[0] + Math.cos(a) * r * 1.15, P[1] + 0.56 + Math.sin(a) * r * 0.8, P[2]];
    });
    b.polyline(pts, 0.012 - k * 0.002, 1, false, 1);
    b.route(pts, k * 0.2, 0.02, 1);
  });
  const threadB: V3[] = [[P[0] - 0.95, P[1] - 0.2, P[2]], [3.6, P[1] - 0.2, 0.2], [2.78, 0.6, 0]];
  b.polyline(threadB, 0.01, 1, false, 1);
  b.route(threadB, 0.55, 0.08, 1);
  b.node(threadB[2], 0.09, 1, 1);

  return b.finish("milestones");
}

/** Testimonials: three frames with dimensional quote marks, hung on one thread. Tags are the testimonials. */
function buildVoices(): Form {
  const b = new FormBuilder(149, { min: [-5, -3.4, -3], max: [5, 3.8, 2] });
  const hub: V3 = [0.2, 0.1, -2.4];
  b.node(hub, 0.14, 1);
  VOICE_FRAMES.forEach(({ c, w, h }, tag) => {
    const [x, y, z] = c;
    b.panel(c, [w, 0, 0], [0, h, 0], 0.04, tag);
    b.polyline([[x - w, y - h, z], [x + w, y - h, z], [x + w, y + h, z], [x - w, y + h, z]], 0.018, 0, true, tag);
    // Corner ticks standing clear of the frame, as on a measured drawing.
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      const cx = x + sx * (w + 0.12);
      const cy = y + sy * (h + 0.12);
      b.beam([cx, cy, z], [cx - sx * 0.2, cy, z], 0.008, 0, tag);
      b.beam([cx, cy, z], [cx, cy - sy * 0.2, z], 0.008, 0, tag);
    });
    // The quote mark: two slanted blocks standing out from the frame, with depth of their own.
    [-0.22, 0.2].forEach((dx) => {
      const qx = x - w * 0.46 + dx;
      const qy = y + h * 0.2;
      b.slab([qx + 0.09, qy + 0.24, z + 0.3], [qx - 0.09, qy - 0.2, z + 0.3], 0.13, 0.13, 1, tag);
      b.node([qx + 0.1, qy + 0.3, z + 0.3], 0.13, 1, tag);
    });
    // Lines of text, kept abstract: the words themselves are on the page.
    [0.28, 0, -0.28, -0.56].forEach((ly, i) => {
      b.beam([x - w * 0.02, y + ly * h * 1.4, z + 0.02], [x + w * (0.82 - (i % 3) * 0.22), y + ly * h * 1.4, z + 0.02], 0.012, 0, tag);
    });
    const end: V3 = [x, y + (y > 0 ? -h : h), z];
    const thread: V3[] = [hub, [x, hub[1], (hub[2] + z) / 2], end];
    b.polyline(thread, 0.008, 0, false, tag);
    b.route(thread, tag * 0.3, 0.05, tag);
    b.node(end, 0.09, 1, tag);
  });
  return b.finish("voices");
}

/** Education: a graph with two large nodes, the school and then the degree, each surrounded by what it gave. */
function buildKnowledge(): Form {
  const b = new FormBuilder(113, { min: [-4, -3, -2], max: [4.5, 3, 2] });
  const { school, degree, schoolInfo, degreeInfo } = KNOWLEDGE;

  const hub = (at: V3, r: number, group: number) => {
    b.block(plus(at, [0, r * 0.32, 0]), [r * 1.15, r * 0.2, r * 1.15], Math.PI / 4, group);
    b.block(plus(at, [0, -r * 0.32, 0]), [r * 1.15, r * 0.2, r * 1.15], Math.PI / 4, group);
    b.ring(at, r, r * 0.3, r * 0.2, 10, group);
    b.panel(at, [r * 0.62, 0, 0], [0, 0, r * 0.62], 0.75);
    b.node(plus(at, [0, 0, r * 0.05]), r * 0.5, group);
  };
  hub(school, 0.54, 0);
  hub(degree, 0.76, 1);

  // The route from one to the other, drawn bright so the graph reads in a single glance.
  const route: V3[] = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const e = t * t * (3 - 2 * t);
    return [school[0] + (degree[0] - school[0]) * t, school[1] + (degree[1] - school[1]) * e, school[2] + (degree[2] - school[2]) * t + Math.sin(t * Math.PI) * 0.5] as V3;
  });
  b.polyline(route, 0.05, 1);
  b.route(route, 0, 0.05);
  b.route(route.slice().reverse(), 0.5, 0.05);

  const info = (at: V3, hubAt: V3, group: number, phase: number) => {
    b.panel(at, [0.3, 0, 0.04], [0, 0.17, 0], 0.07);
    b.polyline([[at[0] - 0.3, at[1] - 0.17, at[2] - 0.04], [at[0] + 0.3, at[1] - 0.17, at[2] + 0.04], [at[0] + 0.3, at[1] + 0.17, at[2] + 0.04], [at[0] - 0.3, at[1] + 0.17, at[2] - 0.04]], 0.013, group, true);
    b.node(at, 0.1, group);
    b.beam(hubAt, at, 0.016, group);
    b.route([hubAt, along(hubAt, at, 0.5), at], phase, 0.08);
  };
  schoolInfo.forEach((n, i) => info(n.at, school, 0, i * 0.3));
  degreeInfo.forEach((n, i) => info(n.at, degree, 1, 0.3 + i * 0.3));

  // Smaller unlabelled nodes around the two hubs, so it reads as part of something larger.
  const extras: V3[] = [];
  for (let i = 0; i < 22; i++) {
    const from = along(school, degree, b.random());
    const a = b.random() * Math.PI * 2;
    const r = 0.9 + b.random() * 1.2;
    const p: V3 = [from[0] + Math.cos(a) * r * 0.9, from[1] + Math.sin(a) * r * 0.8, from[2] + (b.random() - 0.5) * 1.4];
    extras.push(p);
    b.node(p, 0.045 + b.random() * 0.03, i % 2);
    b.beam(from, p, 0.004, i % 2);
    if (i % 5 === 0) b.path(from, p, QUIET);
  }
  extras.forEach((p, i) => {
    if (i % 3 === 0) b.beam(p, extras[(i + 7) % extras.length], 0.003, 0);
  });
  return b.finish("knowledge");
}

/** Contact: the hero's core again, with every stream of the page arriving at it. */
function buildConvergence(): Form {
  const b = new FormBuilder(127, { min: [-6, -3.5, -3], max: [6, 4.5, 2] });
  laptopBody(b, [0, 0, 0], LAPTOP.scales.convergence ?? 1);
  CONVERGE.streams.forEach(({ from, to }, s) => {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const start: V3 = [from[0] + Math.cos(a) * 0.65 * (1 + (i % 3) * 0.3), from[1] + Math.sin(a) * 0.65, from[2] + Math.sin(a * 2) * 0.5];
      const end: V3 = [to[0] + Math.cos(a) * 0.1, to[1], to[2] + Math.sin(a) * 0.1];
      const pts: V3[] = Array.from({ length: 7 }, (_, k) => {
        const t = k / 6;
        const e = 1 - (1 - t) * (1 - t);
        return [start[0] + (end[0] - start[0]) * e, start[1] + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * e] as V3;
      });
      b.polyline(pts, 0.009, 0);
      b.route(pts, s * 0.3 + i * 0.11, 0.07);
      b.node(start, 0.1, s % 2);
    }
    b.ring(from, 0.34, 0.08, 0.08, 8, 0);
    b.node(from, 0.2, 1);
  });
  return b.finish("convergence");
}

/** Freelance: the laptop from the hero, with each site it put live as a window of its own, one per client. */
function buildFreelance(): Form {
  const b = new FormBuilder(131, { min: [-4, -3.5, -2], max: [4, 3.5, 2] });
  const s = LAPTOP.scales.freelance ?? 1;
  laptopBody(b, [0, 0, 0], s);
  CLIENT_SITES.forEach((c, i) => {
    interfacePanel(b, c, [CLIENT_WINDOW.w, 0, 0.03], [0, CLIENT_WINDOW.h, -0.06], 0, i, [0, 1, 2, 0][i]);
    const left = c[0] < 0;
    const below = c[1] < 0;
    const from: V3 = below
      ? [(left ? -1 : 1) * (LAPTOP.width / 2) * s, LAPTOP.baseY * s, 0.3]
      : [(left ? -1 : 1) * (LAPTOP.width / 2) * s, LAPTOP.lidTop[1] * s, LAPTOP.lidTop[2] * s];
    const to: V3 = [c[0], c[1] + (below ? CLIENT_WINDOW.h : -CLIENT_WINDOW.h), c[2]];
    const bend: V3 = [to[0], from[1], (from[2] + to[2]) / 2];
    b.polyline([from, bend, to], 0.024, 0, false, i);
    b.route([from, bend, to], i * 0.25, 0.08, i);
    b.node(to, 0.12, 1, i);
  });
  return b.finish("freelance");
}

function mapForm(
  form: Form,
  map: (x: number, y: number, z: number) => V3,
  thickness = 1,
  radius = 1,
): Form {
  const out: Form = {
    beams: form.beams.slice(),
    beamGroups: form.beamGroups,
    beamTags: form.beamTags,
    paths: form.paths.slice(),
    pathTags: form.pathTags,
    panels: form.panels.slice(),
    panelTags: form.panelTags,
    nodes: form.nodes.slice(),
    nodeGroups: form.nodeGroups,
    nodeTags: form.nodeTags,
  };
  const point = (arr: Float32Array, i: number) => {
    const [x, y, z] = map(arr[i], arr[i + 1], arr[i + 2]);
    arr[i] = x;
    arr[i + 1] = y;
    arr[i + 2] = z;
  };
  for (let i = 0; i < COUNT.beams; i++) {
    const o = i * STRIDE.beams;
    point(out.beams, o);
    point(out.beams, o + 3);
    out.beams[o + 6] *= thickness;
    out.beams[o + 7] *= thickness;
  }
  for (let i = 0; i < COUNT.paths; i++) {
    const o = i * STRIDE.paths;
    point(out.paths, o);
    point(out.paths, o + 3);
  }
  for (let i = 0; i < COUNT.panels; i++) {
    const o = i * STRIDE.panels;
    // Transform corners, then recover half-extents, so panels stay attached to the frame.
    const [cx, cy, cz] = map(out.panels[o], out.panels[o + 1], out.panels[o + 2]);
    const ue = map(
      out.panels[o] + out.panels[o + 3],
      out.panels[o + 1] + out.panels[o + 4],
      out.panels[o + 2] + out.panels[o + 5],
    );
    const ve = map(
      out.panels[o] + out.panels[o + 6],
      out.panels[o + 1] + out.panels[o + 7],
      out.panels[o + 2] + out.panels[o + 8],
    );
    out.panels.set([cx, cy, cz, ue[0] - cx, ue[1] - cy, ue[2] - cz, ve[0] - cx, ve[1] - cy, ve[2] - cz], o);
  }
  for (let i = 0; i < COUNT.nodes; i++) {
    const o = i * STRIDE.nodes;
    point(out.nodes, o);
    out.nodes[o + 3] *= radius;
  }
  return out;
}

/**
 * The start of the assembly. The core barely moves, so it is what's seen first; every other part waits further out
 * along its own direction, the further from the core the further it has to come.
 */
function buildScatter(core: Form): Form {
  const out = mapForm(core, (x, y, z) => [x, y, z]);
  for (let i = 0; i < COUNT.beams; i++) {
    const o = i * STRIDE.beams;
    const mx = (out.beams[o] + out.beams[o + 3]) / 2;
    const my = (out.beams[o + 1] + out.beams[o + 4]) / 2;
    const mz = (out.beams[o + 2] + out.beams[o + 5]) / 2;
    const dist = Math.hypot(mx, my, mz);
    const push = Math.max(0, dist - 1.9) * 1.1;
    if (dist < 1e-3) continue;
    for (const k of [0, 3]) {
      out.beams[o + k] += (mx / dist) * push;
      out.beams[o + k + 1] += (my / dist) * push;
      out.beams[o + k + 2] += (mz / dist) * push;
    }
  }
  return out;
}

export type FormId =
  | "scatter"
  | "core"
  | "freelance"
  | "ecosystemPacked"
  | "ecosystem"
  | "bloodlink"
  | "prolink"
  | "wanderlust"
  | "gitgraph"
  | "constellation"
  | "neuralSeed"
  | "neural"
  | "milestones"
  | "voices"
  | "knowledge"
  | "convergence";

export function buildForms(): Record<FormId, Form> {
  const core = buildCore();
  return {
    scatter: buildScatter(core),
    core,
    freelance: buildFreelance(),
    ecosystemPacked: buildEcosystem(ECOSYSTEM.packed),
    ecosystem: buildEcosystem(ECOSYSTEM.spread),
    bloodlink: buildBloodLink(),
    prolink: buildProLink(),
    wanderlust: buildWanderlust(),
    gitgraph: buildGitGraph(),
    constellation: buildConstellation(),
    neuralSeed: buildNeural(0.28),
    neural: buildNeural(),
    milestones: buildMilestones(),
    voices: buildVoices(),
    knowledge: buildKnowledge(),
    convergence: buildConvergence(),
  };
}
