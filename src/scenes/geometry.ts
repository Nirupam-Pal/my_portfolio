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
  CARD,
  cardAt,
  clusterLayout,
  CONVERGE,
  CORE,
  ECOSYSTEM,
  GIT,
  KNOWLEDGE,
  layerTech,
  layerX,
  listings,
  MAP,
  MILESTONE,
  miniNetwork,
  neuralRing,
  neurons,
  pinAt,
  PRO,
  skillLayout,
  skillLinkTag,
  synapses,
  synapseTag,
  type V3,
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
  quad(p0: V3, p1: V3, p2: V3, p3: V3, glow = 0) {
    const c: V3 = [
      (p0[0] + p1[0] + p2[0] + p3[0]) / 4,
      (p0[1] + p1[1] + p2[1] + p3[1]) / 4,
      (p0[2] + p1[2] + p2[2] + p3[2]) / 4,
    ];
    const u: V3 = [(p1[0] - p0[0]) / 2, (p1[1] - p0[1]) / 2, (p1[2] - p0[2]) / 2];
    const v: V3 = [(p3[0] - p0[0]) / 2, (p3[1] - p0[1]) / 2, (p3[2] - p0[2]) / 2];
    this.panel(c, u, v, glow);
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

/**
 * The machine at the centre of the hero, reused where the story returns to it. Precision layers around an open
 * heart of light, with four ports where the rest of the application connects. Deliberately not any real chip.
 */
function coreBody(b: FormBuilder, c: V3, s: number, group = 0) {
  const P = (x: number, y: number, z: number): V3 => [c[0] + x * s, c[1] + y * s, c[2] + z * s];
  const plate = (y: number, size: number, h: number, yaw: number) => b.block(P(0, y, 0), [size * s, h * s, size * s], yaw, group);

  plate(-1.08, 2.25, 0.14, 0);
  b.ring(P(0, -0.76, 0), 1.08 * s, 0.34 * s, 0.2 * s, 8, group, -1, Math.PI / 8);
  plate(-0.44, 1.62, 0.1, Math.PI / 4);
  b.ring(P(0, 0, 0), 0.76 * s, 0.46 * s, 0.13 * s, 8, group);
  plate(0.44, 1.62, 0.1, Math.PI / 4);
  b.ring(P(0, 0.76, 0), 1.08 * s, 0.34 * s, 0.2 * s, 8, group, -1, Math.PI / 8);
  // The cap is open in the middle, so the light inside shows from above as well.
  [[0, -0.66], [0, 0.66]].forEach(([x, z]) => b.block(P(x, 1.08, z), [2.25 * s, 0.14 * s, 0.93 * s], 0, group));
  [[-0.66, 0], [0.66, 0]].forEach(([x, z]) => b.block(P(x, 1.08, z), [0.93 * s, 0.14 * s, 0.4 * s], 0, group));

  // Ports, and the fine traces running out to them over each layer.
  ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).forEach(([x, z], n) => {
    const yaw = x === 0 ? Math.PI / 2 : 0;
    b.block(P(x * 1.36, 0, z * 1.36), [0.5 * s, 0.26 * s, 0.34 * s], yaw, group);
    b.block(P(x * 1.66, 0, z * 1.66), [0.1 * s, 0.4 * s, 0.5 * s], yaw, group);
    const to = P(x * 1.62, 0.15, z * 1.62);
    b.route([P(x * 0.5, 0.15, z * 0.5), P(x * 1.0, 0.15, z * 1.0), to], n * 0.2, 0.06);
    const low = P(x * 1.62, -0.15, z * 1.62);
    b.route([low, P(x * 1.0, -0.15, z * 1.0), P(x * 0.5, -0.15, z * 0.5)], 0.1 + n * 0.2, 0.06);
  });

  // The heart: light moving between the layers.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * 0.38;
    const z = Math.sin(a) * 0.38;
    b.route([P(x, -0.42, z), P(x, -0.14, z), P(x, 0.14, z), P(x, 0.42, z)], i * 0.25, 0.05);
  }
  b.panel(P(0, -0.2, 0), [0.62 * s, 0, 0], [0, 0, 0.62 * s], 0.75);
  b.panel(P(0, 0.2, 0), [0.62 * s, 0, 0], [0, 0, 0.62 * s], 0.75);
  b.node(P(0, 0, 0), 0.42 * s, group);
  [-0.26, 0.26].forEach((y) => b.node(P(0, y, 0), 0.16 * s, group));
  [0, 1, 2, 3].forEach((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.node(P(Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38), 0.1 * s, 1);
  });
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
  coreBody(b, [0, 0, 0], 1);

  // Frontend: thin screens hanging in the air above the core, tilted towards the viewer.
  const F = CORE.frontend;
  interfacePanel(b, plus(F, [-0.82, 0.1, -0.5]), [0.74, 0.02, 0.1], [0.04, 0.56, -0.2], 0, 0, 1);
  interfacePanel(b, plus(F, [0.25, 0.42, 0]), [0.82, 0, 0.04], [0, 0.6, -0.18], 0, 0, 0);
  interfacePanel(b, plus(F, [-0.3, -0.56, 0.75]), [0.62, -0.02, 0.12], [0.02, 0.42, -0.14], 0, 0, 2);
  const frontPort: V3 = [0, 0, 1.72];
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
  const backPort: V3 = [1.72, 0, 0];
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
  b.beam([0, -1.15, 0], dbTop, 0.034, 0, 1);
  b.route([dbTop, [0, -1.15, 0]], 0.3, 0.1, 1);
  b.route([[D[0] + 1.11, D[1] + 0.3, D[2] + 0.18], [0.55, -1.15, 0.2]], 0.65, 0.1, 1);

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
  b.route([[0.9, 1.1, -0.2], plus(A, [-0.62, -0.46, 0])], 0.3, 0.1, 1);

  return b.finish("core");
}

/**
 * About: the hero's machine pulled apart along one axis, so each layer can be read by itself and the data can be seen
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
 * Wanderlust: the listings as data on a map. Each real listing floats as a card above its pin, and a search panel
 * reaches down to them. Tags are the listings. The smaller cards stand in for the rest of the listings page.
 */
function buildWanderlust(): Form {
  const b = new FormBuilder(71, { min: [-5, -1.5, -7], max: [5, 3, 3] });
  const { y, x: mapX, nearZ, farZ } = MAP;

  // The map: a fine grid, with a couple of routes drawn across it.
  for (let i = 0; i <= 12; i++) {
    const gx = -mapX + (i / 12) * mapX * 2;
    b.beam([gx, y, nearZ], [gx, y, farZ], i % 3 === 0 ? 0.008 : 0.004, 0);
  }
  for (let i = 0; i <= 11; i++) {
    const gz = nearZ + (i / 11) * (farZ - nearZ);
    b.beam([-mapX, y, gz], [mapX, y, gz], i % 3 === 0 ? 0.008 : 0.004, 0);
  }
  const road = (wob: number, k: number): V3[] =>
    Array.from({ length: 15 }, (_, i) => {
      const t = i / 14;
      const gx = -mapX + t * mapX * 2;
      return [gx, y + 0.015, k + Math.sin(t * 5 + wob) * 0.9 - t * 1.4] as V3;
    });
  const r1 = road(0.4, 0.9);
  const r2 = road(2.3, -2.2);
  b.polyline(r1, 0.016, 0);
  b.polyline(r2, 0.012, 0);
  b.route(r1, 0, 0.03);
  b.route(r2, 0.5, 0.03);

  const card = (c: V3, w: number, h: number, tag: number, glow: number, thick: number) => {
    b.panel(c, [w, 0, 0], [0, h, 0], 0.05, tag);
    b.polyline([[c[0] - w, c[1] - h, c[2]], [c[0] + w, c[1] - h, c[2]], [c[0] + w, c[1] + h, c[2]], [c[0] - w, c[1] + h, c[2]]], thick, 0, true, tag);
    // The photograph, then the title and the nightly price below it.
    b.panel([c[0], c[1] + h * 0.26, c[2] + 0.01], [w * 0.88, 0, 0], [0, h * 0.58, 0], glow, tag);
    b.beam([c[0] - w * 0.88, c[1] - h * 0.52, c[2]], [c[0] + w * 0.3, c[1] - h * 0.52, c[2]], thick * 0.9, 0, tag);
    b.beam([c[0] - w * 0.88, c[1] - h * 0.78, c[2]], [c[0] - w * 0.2, c[1] - h * 0.78, c[2]], thick * 1.4, 0, tag);
  };

  // Each pin has a seat on the map, a stem and the listing's card.
  listings.forEach((l, tag) => {
    const pin = pinAt(l);
    const c = cardAt(l);
    const under: V3 = [c[0], c[1] - CARD.h, c[2]];
    b.ring(pin, 0.3, 0.05, 0.05, 8, 0, tag);
    b.node(plus(pin, [0, 0.03, 0]), 0.16, 1, tag);
    b.beam(pin, under, 0.02, 0, tag);
    b.route([pin, along(pin, under, 0.5), under], tag * 0.3, 0.08, tag);
    card(c, CARD.w, CARD.h, tag, 0.14, 0.024);
  });

  // The search that found them: a query panel, and results travelling out to each card.
  const S = MAP.search;
  b.panel(S, [0.8, 0, 0], [0, 0.26, 0], 0.05);
  b.polyline([[S[0] - 0.8, S[1] - 0.26, S[2]], [S[0] + 0.8, S[1] - 0.26, S[2]], [S[0] + 0.8, S[1] + 0.26, S[2]], [S[0] - 0.8, S[1] + 0.26, S[2]]], 0.02, 0, true);
  b.beam([S[0] - 0.64, S[1], S[2]], [S[0] + 0.3, S[1], S[2]], 0.018, 0);
  b.node([S[0] + 0.58, S[1], S[2]], 0.1, 1);
  listings.forEach((l, tag) => {
    const c = cardAt(l);
    const pts = arc([S[0], S[1] - 0.26, S[2]], [c[0], c[1] + CARD.h, c[2]], 0.12, 6);
    b.polyline(pts, 0.006, 0, false, tag);
    b.route(pts, tag * 0.22, 0.04, tag);
  });

  // The rest of the listings, further across the map.
  for (let i = 0; i < 12; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const gx = side * (0.8 + b.random() * 3.3);
    const gz = -2.2 - b.random() * 3.8;
    const lift = 0.55 + b.random() * 0.55;
    b.ring([gx, y, gz], 0.15, 0.03, 0.03, 6, 0);
    b.node([gx, y + 0.02, gz], 0.08, 1);
    b.beam([gx, y, gz], [gx, y + lift - 0.2, gz], 0.011, 0);
    if (i < 8) card([gx, y + lift, gz], 0.32, 0.2, -1, 0.06, 0.012);
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
 * Achievements: the same small network twice, in gold. On the left an award ring closes around it; on the right it
 * broadcasts outward, because the second achievement is having presented it to an audience.
 */
function buildMilestones(): Form {
  const b = new FormBuilder(101, { min: [-10, -3, -3], max: [10, 3.5, 3] });
  const network = (cx: number, group: number, r: number, scale: number) => {
    const pts = miniNetwork.map(([x, y, z]) => [cx + x * scale, MILESTONE.y + y * scale, z * scale] as V3);
    pts.forEach((p, i) => {
      b.node(p, i === 0 ? r * 2 : r, group);
      if (i > 0) {
        b.beam(pts[0], p, 0.016, group);
        b.route([p, pts[0]], i * 0.15, 0.05);
      }
    });
    pts.slice(1).forEach((p, i, rest) => b.beam(p, rest[(i + 1) % rest.length], 0.006, group));
  };

  // First prize: a machined ring closing around the winning network.
  const X1 = MILESTONE.left;
  const Y = MILESTONE.y;
  network(X1, 0, 0.14, 1);
  const ringAt = (x: number, r: number, n: number): V3[] =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [x + Math.cos(a) * r, Y + Math.sin(a) * r, 0] as V3;
    });
  const outer = ringAt(X1, 1.92, 24);
  outer.forEach((p, i) => b.beam(p, outer[(i + 1) % outer.length], 0.11, 0));
  const fine = ringAt(X1, 2.12, 24);
  fine.forEach((p, i) => b.beam(p, fine[(i + 1) % fine.length], 0.008, 0));
  b.route([...fine, fine[0]], 0, 0.03);
  outer.forEach((p, i) => {
    if (i % 6 === 0) b.node(p, 0.13, 0);
  });

  // Presented: the network sending outward in widening arcs, each with listeners along it.
  const X2 = MILESTONE.right;
  network(X2, 1, 0.12, 0.82);
  [1.3, 1.82, 2.34].forEach((r, k) => {
    [-1, 1].forEach((side) => {
      const pts: V3[] = Array.from({ length: 11 }, (_, i) => {
        const a = (i / 10 - 0.5) * 1.5;
        return [X2 + side * Math.cos(a) * r, Y + Math.sin(a) * r, 0] as V3;
      });
      b.polyline(pts, 0.014 - k * 0.002, 1);
      b.route(pts.slice(0, 6).reverse(), 0.1 + k * 0.2, 0.03);
      b.route(pts.slice(5), 0.1 + k * 0.2, 0.03);
      pts.forEach((p, i) => {
        if (i % 2 === 1) b.node(p, 0.07, 1);
      });
    });
  });
  return b.finish("milestones");
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
  coreBody(b, [0, 0, 0], 0.9);
  CONVERGE.streams.forEach(({ from }, s) => {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const start: V3 = [from[0] + Math.cos(a) * 0.65 * (1 + (i % 3) * 0.3), from[1] + Math.sin(a) * 0.65, from[2] + Math.sin(a * 2) * 0.5];
      const end: V3 = [from[0] * 0.2, from[1] * 0.2, from[2] * 0.2];
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
  | "knowledge"
  | "convergence";

export function buildForms(): Record<FormId, Form> {
  const core = buildCore();
  return {
    scatter: buildScatter(core),
    core,
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
    knowledge: buildKnowledge(),
    convergence: buildConvergence(),
  };
}
