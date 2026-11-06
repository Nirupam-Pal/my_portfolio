/**
 * Every form in the experience is built from the same fixed pool of instances.
 * A generator describes a form as beams, light paths, glass panels and nodes; the
 * engine then interpolates between any two forms, so nothing ever cuts or fades:
 * the steel of the hero tower physically becomes each later scene.
 */
import { clusters, skillLinks } from "@/data/skills";

import {
  arc,
  attendanceWing,
  avatarOf,
  BLOOD,
  bloodFrame,
  clusterLayout,
  creativityArcs,
  creativityPoint,
  ENGINEERING_X,
  engineeringLanes,
  floorY,
  FOUNDATION,
  lane,
  leadershipSpokes,
  leaveWing,
  listingAt,
  listings,
  MAST,
  miniNetwork,
  linkTag,
  outerRect,
  PODIUM,
  PRO,
  skillLayout,
  spokePoint,
  STRATA,
  TEAM_ANGLES,
  teamPoint,
  terrain,
  THRESHOLD,
  TOWER,
  towerModules,
  towerTech,
  TREE_START,
  type V3,
} from "./layouts";

export const COUNT = { beams: 480, paths: 170, panels: 44, nodes: 96 } as const;
export const STRIDE = { beams: 7, paths: 7, panels: 10, nodes: 4 } as const;

export interface Form {
  /** ax ay az bx by bz thickness */
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
    this.beamsList.push({ a, b, t, group, tag });
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
      this.beamsList.push({ a: p, b: p, t: 0, group: 255, tag: -1 });
    }
    // Sorting by height means morphs read as floors rearranging, not a swarm crossing itself.
    const midY = (r: BeamRecord) => r.a[1] + r.b[1];
    const beamList = this.beamsList.slice(0, COUNT.beams).sort((x, y) => midY(x) - midY(y));

    const beams = new Float32Array(COUNT.beams * STRIDE.beams);
    const beamGroups = new Uint8Array(COUNT.beams);
    const beamTags = new Int16Array(COUNT.beams);
    beamList.forEach((r, i) => {
      beams.set([...r.a, ...r.b, r.t], i * STRIDE.beams);
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

function rectAt(y: number, w: number, d: number, rot: number, ox = 0, oz = 0): V3[] {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const corners: [number, number][] = [
    [-w, -d],
    [w, -d],
    [w, d],
    [-w, d],
  ];
  return corners.map(([x, z]) => [x * c - z * s + ox, y, x * s + z * c + oz] as V3);
}

/**
 * The hero: the stack as a building. Heavy slabs divide it into four tiers, database at the bottom and frontend at the
 * top. The service core carries one node per technology, and each cantilevered module is a real piece of work,
 * wired through the core to the technologies it uses.
 */
function buildTower(): Form {
  const b = new FormBuilder(11, { min: [-2.2, -4.7, -2.2], max: [2.2, 4.7, 2.2] });
  const floors = TOWER.floors;
  let prevOuter: V3[] | null = null;
  let prevCore: V3[] | null = null;
  const floorOuter: V3[][] = [];
  const floorCore: V3[][] = [];

  for (let i = 0; i < floors; i++) {
    const f = i / (floors - 1);
    const y = floorY(i);
    const { w, d, twist } = outerRect(f);
    const outer = rectAt(y, w, d, twist);
    const core = rectAt(y, TOWER.column, TOWER.column, 0);
    floorOuter.push(outer);
    floorCore.push(core);

    // Every fourth floor is a slab between two tiers of the stack.
    const mechanical = i % 4 === 0;
    b.polyline(outer, mechanical ? 0.05 : 0.026, 0, true);
    b.polyline(core, 0.018, 1, true);
    if (mechanical) b.quad(outer[0], outer[1], outer[2], outer[3]);

    if (prevOuter && prevCore) {
      for (let c = 0; c < 4; c++) {
        b.beam(prevOuter[c], outer[c], 0.03, 0);
        b.beam(prevCore[c], core[c], 0.02, 1);
      }
      if (i % 2 === 0) {
        const face = i % 4;
        b.beam(prevOuter[face], outer[(face + 1) % 4], 0.009, 0);
      }
      if (b.random() < 0.5) {
        const face = Math.floor(b.random() * 4);
        b.quad(prevOuter[face], prevOuter[(face + 1) % 4], outer[(face + 1) % 4], outer[face]);
      }
    }
    if (i % 2 === 1) {
      for (let c = 0; c < 4; c++) b.beam(outer[c], core[c], 0.012, 0);
    }
    prevOuter = outer;
    prevCore = core;
  }

  // The stack, in the core.
  towerTech.forEach((tech) => b.node(tech.at, 0.075, 1, tech.tag));

  // Real work, cantilevered off the core. Each module's light runs to the technologies it uses.
  towerModules.forEach((module, m) => {
    const { at: c, size: s, angle, tag } = module;
    const y = c[1];
    b.box(c, s, 0.015, 0, tag);
    const near: V3 = [Math.cos(angle) * TOWER.column, y, Math.sin(angle) * TOWER.column];
    const end: V3 = [c[0] - Math.cos(angle) * s[0] * 0.5, y, c[2] - Math.sin(angle) * s[2] * 0.5];
    b.beam([near[0], y + 0.03, near[2]], [end[0], y + 0.03, end[2]], 0.014, 0, tag);
    b.beam([near[0], y - 0.03, near[2]], [end[0], y - 0.03, end[2]], 0.014, 0, tag);
    b.panel(c, [s[0] / 2, 0, 0], [0, s[1] / 2, 0], 0, tag);
    b.panel([c[0], c[1] + s[1] / 2, c[2]], [s[0] / 2, 0, 0], [0, 0, s[2] / 2], 0, tag);
    b.node(end, 0.07, 0, tag);
    b.node(c, 0.14, 1, tag);

    module.uses.forEach((t, n) => {
      const techAt = towerTech[t].at;
      b.route([c, near, [near[0], techAt[1], near[2]], techAt], n * 0.09, 0.05, linkTag(m, t));
    });
    // Not every module is software: this one runs to the people it coordinates.
    module.team.forEach((person, n) => {
      b.beam(c, person.at, 0.008, 0, tag);
      b.node(person.at, 0.09, 1, tag);
      b.route([c, person.at], n * 0.2, 0.05, tag);
    });
  });

  // Light rising through the service core.
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < floors - 1; i++) {
      b.path(floorCore[i][c * 2], floorCore[i + 1][c * 2], i * 0.06 + c * 0.5);
    }
  }
  // Perimeter circuits on selected floors.
  [4, 8, 12, 16].forEach((f, n) => {
    const o = floorOuter[f];
    b.route([o[0], o[1], o[2], o[3], o[0]], n * 0.23, 0.08);
  });

  // Tall, thin gates give the mass a sense of scale and scaffold.
  const gate = (yaw: number, w: number, h: number) => {
    const c = Math.cos(yaw) * w;
    const s = Math.sin(yaw) * w;
    b.polyline(
      [
        [-c, -h, -s],
        [c, -h, s],
        [c, h, s],
        [-c, h, -s],
      ],
      0.009,
      0,
      true,
    );
  };
  gate(0.5, 3.05, 5);
  gate(-1.05, 2.6, 4.3);

  // Crown.
  const crown = floorOuter[floors - 1];
  crown.forEach((p) => b.node(p, 0.045, 0));

  return b.finish("tower");
}

/** Four plates, one per area of expertise, each drawing what that paragraph of the About section says. */
function buildStrata(): Form {
  const b = new FormBuilder(23, { min: [-3, -3, -3], max: [3, 3, 3] });
  const { levels, R } = STRATA;

  levels.forEach((y, g) => {
    b.polyline(
      [
        [-R, y, -R],
        [R, y, -R],
        [R, y, R],
        [-R, y, R],
      ],
      0.022,
      g,
      true,
    );
    b.panel([0, y, 0], [R, 0, 0], [0, 0, R]);
  });

  // Engineering: the three layers named in the copy, tied by the auth that runs through them all.
  const yE = levels[0];
  engineeringLanes.forEach(({ z, left, right }, lane2) => {
    b.beam([-R, yE, z], [R, yE, z], 0.016, 0);
    b.beam([-R, yE, z + 0.42], [R, yE, z + 0.42], 0.005, 0);
    b.beam([-R, yE, z - 0.42], [R, yE, z - 0.42], 0.005, 0);
    b.node([ENGINEERING_X.left, yE, z], 0.11, 0);
    b.node([ENGINEERING_X.right, yE, z], 0.11, 0);
    if (left && right) b.route([[-R, yE, z], [ENGINEERING_X.left, yE, z], [ENGINEERING_X.right, yE, z], [ENGINEERING_X.rail, yE, z]], lane2 * 0.2, 0.08);
  });
  b.beam([ENGINEERING_X.rail, yE, -R], [ENGINEERING_X.rail, yE, R], 0.03, 0);
  b.route([[ENGINEERING_X.rail, yE, -2.1], [ENGINEERING_X.rail, yE, 0], [ENGINEERING_X.rail, yE, 2.1]], 0.1, 0.1);
  engineeringLanes.forEach(({ z }) => b.node([ENGINEERING_X.rail, yE, z], 0.08, 0));

  // Creativity: one arc per discipline Nirupam works alongside, all meeting at one corner.
  const yC = levels[1];
  creativityArcs.forEach(({ ring }, n) => {
    const r = ring * 0.72;
    const pts: V3[] = [];
    for (let s = 0; s <= 9; s++) {
      const a = (s / 9) * (Math.PI / 2);
      pts.push([-R + Math.cos(a) * r, yC, -R + Math.sin(a) * r]);
    }
    b.polyline(pts, 0.016, 1);
    b.route(pts, n * 0.3, 0.05);
    const p = creativityPoint(ring);
    b.node(p, 0.13, 1);
    b.beam([-R, yC, -R], p, 0.007, 1);
  });

  // Problem solving: a decision tree converging on one lit route.
  const yP = levels[2];
  const branch = (p: V3, depth: number, spread: number, lit: boolean) => {
    if (depth === 0) {
      b.node(p, lit ? 0.13 : 0.05, 2);
      return;
    }
    // Branches end at different distances: most options stop early, one route goes all the way.
    const reach = lit ? 1.06 : 0.8 + b.random() * 0.28;
    const left: V3 = [p[0] + reach, yP, p[2] - spread];
    const right: V3 = [p[0] + reach, yP, p[2] + spread];
    b.beam(p, left, 0.012, 2);
    b.beam(p, right, 0.012, 2);
    if (lit) b.path(p, right, (4 - depth) * 0.14);
    branch(left, depth - 1, spread * 0.55, false);
    branch(right, depth - 1, spread * 0.55, lit);
  };
  branch(TREE_START, 4, 1.05, true);

  // Leadership: one hub, and what it actually does. Tasks go on to the three teams.
  const yL = levels[3];
  const ringPts: V3[] = [];
  for (let s = 0; s < 18; s++) {
    const a = (s / 18) * Math.PI * 2;
    ringPts.push([Math.cos(a) * 1.95, yL, Math.sin(a) * 1.95]);
  }
  b.polyline(ringPts, 0.009, 3, true);
  leadershipSpokes.forEach(({ angle }, n) => {
    const p = spokePoint(angle);
    b.beam([0, yL, 0], p, 0.018, 3);
    b.node(p, 0.13, 3);
    b.route([[0, yL, 0], [p[0] * 0.5, yL, p[2] * 0.5], p], n / 3, 0.08);
  });
  const tasks = spokePoint(leadershipSpokes[0].angle);
  [-0.35, 0, 0.35].forEach((da, n) => {
    const a = leadershipSpokes[0].angle + da;
    const p: V3 = [Math.cos(a) * 2.6, yL, Math.sin(a) * 2.6];
    b.beam(tasks, p, 0.008, 3);
    b.node(p, 0.06, 3);
    b.route([tasks, p], 0.4 + n * 0.1, 0.08);
  });
  b.node([0, yL, 0], 0.17, 3);

  // Columns tying the plates into one structure.
  for (let i = 0; i < 3; i++) {
    for (const [x, z] of [
      [-R, -R],
      [R, -R],
      [R, R],
      [-R, R],
    ]) {
      b.beam([x, levels[i], z], [x, levels[i + 1], z], 0.012, 4);
    }
  }

  return b.finish("strata");
}

/**
 * BloodLink, acting out its request flow. Tags are the steps: 0 search by location, 1 send a request, 2 donor accepts,
 * 3 chat opens. Node groups: 0 donors, 1 patients, 2 blood banks. The frames on the ground are the real search
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
    b.node(p, 0.2, 2);
    b.box(p, [0.32, 0.32, 0.32], 0.009, 2);
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

/** Experience: a slim mast with one built-out floor per job, reached in order as the timeline is. */
function buildMast(): Form {
  const b = new FormBuilder(83, { min: [-2, -4.6, -2], max: [2, 4.6, 2] });
  const { half, bottom, top, prejestY, thoughtflowY } = MAST;
  const levels = 18;
  let prev: V3[] | null = null;
  for (let i = 0; i < levels; i++) {
    const y = bottom + (i / (levels - 1)) * (top - bottom);
    const rect = rectAt(y, half, half, 0);
    b.polyline(rect, i % 4 === 0 ? 0.024 : 0.012, 0, true);
    if (prev) {
      for (let c = 0; c < 4; c++) b.beam(prev[c], rect[c], 0.016, 0);
      b.beam(prev[i % 4], rect[(i + 1) % 4], 0.006, 0);
      b.path([0, prev[0][1], 0], [0, y, 0], i * 0.05);
    }
    prev = rect;
  }

  // Prejest-HR: the Leave and Attendance module, one wing each.
  const slab = (y: number, r: number, group: number) => {
    b.polyline(rectAt(y, r, r * 0.6, 0), 0.024, group, true);
    b.panel([0, y, 0], [r, 0, 0], [0, 0, r * 0.6]);
  };
  slab(prejestY, 2.25, 1);
  // Leave: a calendar, laid flat.
  const [lx, ly, lz] = leaveWing;
  for (let i = 0; i <= 5; i++) b.beam([lx - 0.6 + i * 0.24, ly + 0.02, lz - 0.48], [lx - 0.6 + i * 0.24, ly + 0.02, lz + 0.48], 0.006, 1);
  for (let i = 0; i <= 4; i++) b.beam([lx - 0.6, ly + 0.02, lz - 0.48 + i * 0.24], [lx + 0.6, ly + 0.02, lz - 0.48 + i * 0.24], 0.006, 1);
  [[1, 1], [2, 1], [3, 2]].forEach(([c, r]) => b.node([lx - 0.6 + (c + 0.5) * 0.24, ly + 0.04, lz - 0.48 + (r + 0.5) * 0.24], 0.07, 1));
  // Attendance: a day's marks, standing in a row.
  const [ax, ay, az] = attendanceWing;
  [0.3, 0.42, 0.36, 0.48, 0.4].forEach((h, i) => {
    const x = ax - 0.5 + i * 0.25;
    b.beam([x, ay, az], [x, ay + h, az], 0.03, 1);
    b.node([x, ay + h, az], 0.06, 1);
  });
  b.route([[half, prejestY + 0.02, 0], [ax - 0.5, ay + 0.02, az]], 0, 0.06);
  b.route([[-half, prejestY + 0.02, 0], [lx + 0.6, ly + 0.02, lz]], 0.3, 0.06);

  // Thought-Flow Media: one hub and the three teams it coordinates.
  const ringPts: V3[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return [Math.cos(a) * 1.65, thoughtflowY, Math.sin(a) * 1.65];
  });
  b.polyline(ringPts, 0.012, 2, true);
  b.node([0, thoughtflowY, 0], 0.2, 2);
  TEAM_ANGLES.forEach((a, i) => {
    const p = teamPoint(a);
    b.beam([0, thoughtflowY, 0], p, 0.02, 2);
    b.node(p, 0.14, 2);
    b.route([[0, thoughtflowY, 0], p], i * 0.2, 0.06);
  });
  b.panel([0, thoughtflowY, 0], [1.65, 0, 0], [0, 0, 1.65]);

  return b.finish("mast");
}

function buildConstellation(): Form {
  const b = new FormBuilder(89, { min: [-5, -3, -3], max: [5, 3, 2] });
  let tag = 0;
  const byId = new Map(skillLayout.map((s) => [s.id, s]));

  clusters.forEach((cluster) => {
    const { c, r } = clusterLayout[cluster.id];
    const members = skillLayout.filter((s) => s.cluster === cluster.id);
    b.node(c, 0.07, 4);

    const ring: V3[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      ring.push([c[0] + Math.cos(a) * r * 1.2, c[1] + Math.sin(a) * r * 0.92, c[2] + Math.sin(a * 2) * 0.28]);
    }
    b.polyline(ring, 0.004, 5, true);
    b.panel([c[0], c[1], c[2] - 0.35], [r * 1.45, 0, 0], [0, r * 1.15, 0]);

    members.forEach((s) => {
      b.node(s.position, 0.075, 3);
      const t = tag++;
      b.beam(c, s.position, 0.005, 6, t);
      b.route([c, s.position], t / 18, 0.2);
    });
  });

  skillLinks.forEach(([from, to], i) => {
    const P = byId.get(from);
    const Q = byId.get(to);
    if (!P || !Q) return;
    const t = tag++;
    const A = P.position;
    const B = Q.position;
    const lift = 0.35 + (i % 3) * 0.12;
    const m1: V3 = [A[0] + (B[0] - A[0]) * 0.33, A[1] + (B[1] - A[1]) * 0.33, A[2] + (B[2] - A[2]) * 0.33 + lift];
    const m2: V3 = [A[0] + (B[0] - A[0]) * 0.66, A[1] + (B[1] - A[1]) * 0.66, A[2] + (B[2] - A[2]) * 0.66 + lift];
    b.beam(A, m1, 0.007, 6, t);
    b.beam(m1, m2, 0.007, 6, t);
    b.beam(m2, B, 0.007, 6, t);
    b.route([A, m1, m2, B], i / skillLinks.length, 0.1);
  });

  return b.finish("constellation");
}

/** Gold. Both forms hold up BloodLink's own network: on an obelisk for the prize, on a screen for the presentation. */
function buildPodium(): Form {
  const b = new FormBuilder(101, { min: [-6, -3, -3], max: [6, 3.5, 3] });
  const X1 = -3.4;

  // Form 1: first prize.
  const levels = 13;
  let prev: V3[] | null = null;
  for (let i = 0; i < levels; i++) {
    const f = i / (levels - 1);
    const y = -2.4 + f * 4.3;
    const r = 0.95 * Math.pow(1 - f, 1.25) + 0.1;
    const rect = rectAt(y, r, r, f * 0.5, X1);
    b.polyline(rect, 0.03 - f * 0.012, 0, true);
    if (prev) for (let c = 0; c < 4; c++) b.beam(prev[c], rect[c], 0.022 - f * 0.01, 0);
    if (i < 3) b.quad(rect[0], rect[1], rect[2], rect[3]);
    prev = rect;
  }
  // The prize is for the project, so its network is what stands on top.
  const network = (cx: number, cy: number, cz: number, s: number, group: number, r: number) => {
    const pts = miniNetwork.map(([x, y, z]) => [cx + x * s, cy + y * s, cz + z * s] as V3);
    pts.forEach((p, i) => {
      b.node(p, i === 0 ? r * 1.8 : r, group);
      if (i > 0) {
        b.beam(pts[0], p, 0.012, group);
        b.route([p, pts[0]], i * 0.15, 0.05);
      }
    });
  };
  network(X1, PODIUM.apexY, 0, 1, 0, 0.14);
  // Laurel arcs.
  for (const side of [-1, 1]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 0.78 - 0.45;
      pts.push([X1 + side * Math.cos(a) * 2.05, -0.15 + Math.sin(a) * 2.5, side * 0.15]);
    }
    b.polyline(pts, 0.014, 0);
    b.route(pts, side > 0 ? 0 : 0.5, 0.04);
    pts.forEach((p, i) => {
      if (i % 2 === 1) b.node(p, 0.05, 0);
    });
  }

  // Form 2: a stepped dais facing an amphitheatre of seats.
  const X2 = 3.4;
  [1.5, 1.1, 0.72].forEach((r, i) => {
    const y = -2.2 + i * 0.26;
    b.box([X2, y, -0.9], [r * 2, 0.24, r * 1.2], 0.016, 1);
    b.panel([X2, y + 0.12, -0.9], [r, 0, 0], [0, 0, r * 0.6]);
  });
  // The screen behind the presenter shows the same network.
  const SY = PODIUM.screenY;
  b.polyline(
    [
      [X2 - 1.15, SY - 0.68, -1.7],
      [X2 + 1.15, SY - 0.68, -1.7],
      [X2 + 1.15, SY + 0.68, -1.7],
      [X2 - 1.15, SY + 0.68, -1.7],
    ],
    0.02,
    1,
    true,
  );
  b.panel([X2, SY, -1.72], [1.15, 0, 0], [0, 0.68, 0], 0.22);
  network(X2, SY, -1.68, 1.1, 1, 0.1);
  // The standing presenter, reduced to a slab of light.
  const sy = -1.42;
  b.box([X2, sy + 0.72, -0.9], [0.22, 1.44, 0.1], 0.012, 1);
  b.panel([X2, sy + 0.72, -0.85], [0.11, 0, 0], [0, 0.72, 0], 1);
  b.node([X2, sy + 1.68, -0.9], 0.2, 1);
  for (let ring = 0; ring < 6; ring++) {
    const r = 1.75 + ring * 0.46;
    const y = -2.28 + ring * 0.2;
    const pts: V3[] = [];
    for (let s = 0; s <= 16; s++) {
      const a = Math.PI * (0.13 + (s / 16) * 0.74);
      pts.push([X2 + Math.cos(a) * r, y, -0.9 + Math.sin(a) * r * 0.9]);
    }
    b.polyline(pts, 0.012, 1);
    if (ring % 2 === 1) b.route(pts, ring * 0.12, 0.03);
    for (let s = 1; s < 16; s += 3) {
      b.node(pts[s], 0.035, 1);
    }
  }
  return b.finish("podium");
}

/** Education: two levels, school and then the degree, with the base of the hero's tower standing on top of them. */
function buildFoundation(): Form {
  const b = new FormBuilder(113, { min: [-3.4, -2.4, -3.4], max: [3.4, 1, 3.4] });
  const { school, degree, schoolR, degreeR } = FOUNDATION;
  const slab = (y: number, r: number, t: number, group: number) => {
    const low = rectAt(y - 0.14, r, r, 0);
    const high = rectAt(y, r, r, 0);
    b.polyline(low, t, group, true);
    b.polyline(high, t, group, true);
    for (let c = 0; c < 4; c++) b.beam(low[c], high[c], t, group);
    b.panel([0, y, 0], [r, 0, 0], [0, 0, r]);
  };
  slab(school, schoolR, 0.022, 0);
  slab(degree, degreeR, 0.03, 1);

  // Columns carrying the degree on the school.
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    b.beam([x * degreeR * 0.9, school, z * degreeR * 0.9], [x * degreeR * 0.9, degree - 0.14, z * degreeR * 0.9], 0.02, 0);
  }

  // The first floors of the tower, using its real plan and twist.
  const floors = 7;
  let prev: V3[] | null = null;
  let prevCore: V3[] | null = null;
  for (let i = 0; i < floors; i++) {
    const y = degree + (i / (floors - 1)) * 1.75;
    const { w, d, twist } = outerRect(i / (TOWER.floors - 1));
    const outer = rectAt(y, w, d, twist);
    const core = rectAt(y, TOWER.column, TOWER.column, 0);
    // Fades out as it rises: this is only the start of what stands on the foundation.
    const t = 0.024 * (1 - (i / floors) * 0.75);
    b.polyline(outer, t, 1, true);
    b.polyline(core, t * 0.7, 1, true);
    if (prev && prevCore) {
      for (let c = 0; c < 4; c++) {
        b.beam(prev[c], outer[c], t, 1);
        b.beam(prevCore[c], core[c], t * 0.7, 1);
      }
    }
    prev = outer;
    prevCore = core;
  }
  b.route([[0, school, 0], [0, degree, 0], [0, degree + 1.75, 0]], 0, 0.2);
  [[-schoolR, schoolR], [schoolR, schoolR], [schoolR, -schoolR], [-schoolR, -schoolR]].forEach(([x, z]) => b.node([x, school, z], 0.07, 0));
  [[-degreeR, degreeR], [degreeR, degreeR], [degreeR, -degreeR], [-degreeR, -degreeR]].forEach(([x, z]) => b.node([x, degree, z], 0.09, 1));
  return b.finish("foundation");
}

/** The closing form: an axis of arches passing everything built so far, ending at an empty plot. */
function buildPortal(): Form {
  const b = new FormBuilder(127, { min: [-3, -2.6, -16], max: [3, 3.2, 2] });
  const arches = 10;
  const spacing = 1.35;
  const W = 2.05;
  const base = -2.5;
  const spring = 0.9;
  const all: V3[][] = [];
  for (let i = 0; i < arches; i++) {
    const z = 1.2 - i * spacing;
    const pts: V3[] = [[-W, base, z], [-W, spring, z]];
    for (let s = 1; s < 14; s++) {
      const a = Math.PI - (s / 14) * Math.PI;
      pts.push([Math.cos(a) * W, spring + Math.sin(a) * W, z]);
    }
    pts.push([W, spring, z], [W, base, z]);
    all.push(pts);
    const t = i === 0 ? 0.07 : 0.04;
    b.polyline(pts, t, 0);
    if (i < 5) {
      const inner = pts.map((p) => [p[0] * 0.93, p[1] <= base ? base : spring + (p[1] - spring) * 0.93, z] as V3);
      b.polyline(inner, 0.008, 0);
    }
  }
  for (let i = 0; i < arches - 1; i++) {
    for (const k of [1, 4, 8, 12, 15]) {
      b.beam(all[i][k], all[i + 1][k], k === 8 ? 0.02 : 0.012, 0);
    }
    b.beam(all[i][0], all[i + 1][0], 0.02, 0);
    b.beam(all[i][16], all[i + 1][16], 0.02, 0);
  }
  // The five pieces of real work, standing along the way.
  THRESHOLD.stops.forEach(({ at }) => {
    const [x, y, z] = at;
    b.box([x, y, z], [0.72, 0.9, 0.5], 0.014, 0);
    b.beam([x, y - 0.45, z], [x, THRESHOLD.base, z], 0.018, 0);
    b.panel([x, y, z + 0.25], [0.3, 0, 0], [0, 0.38, 0], 0.4);
    b.node([x, y + 0.6, z], 0.08, 1);
  });
  // The plot at the end has been marked out, and nothing has been built on it yet.
  const [px, py, pz] = THRESHOLD.plot;
  const plot: V3[] = [
    [px - 1.15, py + 0.02, pz - 0.9],
    [px + 1.15, py + 0.02, pz - 0.9],
    [px + 1.15, py + 0.02, pz + 0.9],
    [px - 1.15, py + 0.02, pz + 0.9],
  ];
  b.polyline(plot, 0.03, 0, true);
  b.route([...plot, plot[0]], 0, 0.05);
  plot.forEach((p) => b.beam(p, [p[0], p[1] + 0.8, p[2]], 0.016, 0));
  plot.forEach((p) => b.node([p[0], p[1] + 0.8, p[2]], 0.06, 1));

  // A single line of light leading through the threshold.
  const axis: V3[] = [];
  for (let i = 0; i <= 26; i++) axis.push([0, base + 0.015, 2.6 - (i / 26) * 19]);
  b.route(axis, 0, 0.03);
  [-1.1, 1.1].forEach((x, side) => {
    const rail: V3[] = [];
    for (let i = 0; i <= 18; i++) rail.push([x, base + 0.015, 1.2 - (i / 18) * 15]);
    b.route(rail, side * 0.5, 0.05);
  });
  for (let i = 0; i < arches; i++) {
    const z = 1.2 - i * spacing;
    b.node([0, spring + W, z], 0.06, 0);
    b.node([-1.1, base + 0.04, z], 0.05, 0);
    b.node([1.1, base + 0.04, z], 0.05, 0);
  }
  b.panel(
    [0, base, 1.2 - ((arches - 1) * spacing) / 2],
    [W, 0, 0],
    [0, 0, ((arches - 1) * spacing) / 2],
  );
  return b.finish("portal");
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

/** The start of the assembly: every member of the tower, flung outward along its own direction. */
function buildScatter(tower: Form): Form {
  const rng = mulberry(7);
  const out = mapForm(tower, (x, y, z) => [x, y, z]);
  for (let i = 0; i < COUNT.beams; i++) {
    const o = i * STRIDE.beams;
    const ax = rng() * Math.PI * 2;
    const dist = 5 + rng() * 9;
    const dx = Math.cos(ax) * dist;
    const dy = (rng() - 0.5) * 9;
    const dz = Math.sin(ax) * dist;
    for (const k of [0, 3]) {
      out.beams[o + k] += dx;
      out.beams[o + k + 1] += dy;
      out.beams[o + k + 2] += dz;
    }
    out.beams[o + 6] *= 0.3;
  }
  for (let i = 0; i < COUNT.paths; i++) {
    const o = i * STRIDE.paths;
    out.paths[o + 3] = out.paths[o];
    out.paths[o + 4] = out.paths[o + 1];
    out.paths[o + 5] = out.paths[o + 2];
  }
  for (let i = 0; i < COUNT.panels; i++) {
    const o = i * STRIDE.panels;
    for (let k = 3; k < 9; k++) out.panels[o + k] = 0;
  }
  for (let i = 0; i < COUNT.nodes; i++) out.nodes[i * STRIDE.nodes + 3] = 0;
  return out;
}

export type FormId =
  | "scatter"
  | "tower"
  | "strata"
  | "bloodlink"
  | "prolink"
  | "wanderlust"
  | "mast"
  | "constellation"
  | "podium"
  | "foundation"
  | "portal";

export function buildForms(): Record<FormId, Form> {
  // Heavier members than the other forms: the opening is where the steel has to read as steel.
  const tower = mapForm(buildTower(), (x, y, z) => [x, y, z], 1.45);
  return {
    scatter: buildScatter(tower),
    tower,
    strata: buildStrata(),
    bloodlink: buildBloodLink(),
    prolink: buildProLink(),
    wanderlust: buildWanderlust(),
    mast: buildMast(),
    constellation: buildConstellation(),
    podium: buildPodium(),
    foundation: buildFoundation(),
    portal: buildPortal(),
  };
}
