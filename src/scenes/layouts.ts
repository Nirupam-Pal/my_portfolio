/**
 * Where the portfolio's real content sits inside the 3D forms. Plain numbers and strings with no builder code,
 * so DOM labels can be projected onto the same points the forms draw, on the main thread and in the worker alike.
 */
import { achievements, education } from "@/data/profile";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { clusters, skillLinks, skills } from "@/data/skills";
import { techList, tiers, work } from "@/data/stack";

import type { PoseId } from "./poses";

export type V3 = readonly [number, number, number];

/* ---------------------------------------- Tags: what lights up together */
export const moduleTag = (m: number) => 100 + m;
export const techTag = (t: number) => 200 + t;
export const linkTag = (m: number, t: number) => 1000 + m * 100 + t;
/** Labels that only belong to the first step of BloodLink's flow. */
export const SEARCH_LABEL_TAG = 10;

const techIndex = (label: string) => techList.findIndex((t) => t.label === label);

/** The tags lit by a step of a form's sequence. */
export function litTagsFor(form: string, step: number): number[] {
  switch (form) {
    case "tower": {
      const uses = work[step]?.uses ?? [];
      return [moduleTag(step), ...uses.flatMap((u) => [techTag(techIndex(u)), linkTag(step, techIndex(u))])];
    }
    case "bloodlink": {
      const tags = Array.from({ length: step + 1 }, (_, i) => i);
      return step === 0 ? [...tags, SEARCH_LABEL_TAG] : tags;
    }
    case "prolink":
      return Array.from({ length: step + 1 }, (_, i) => i);
    case "wanderlust":
      return [step];
    default:
      return [];
  }
}

/* ---------------------------------------- Hero tower */
export const TOWER = { floors: 17, height: 9, column: 0.34, yaw: 0.42 } as const;
export const floorY = (floor: number) => -TOWER.height / 2 + (floor / (TOWER.floors - 1)) * TOWER.height;
export const outerRect = (f: number) => ({ w: 1.5 - 0.5 * f, d: 1.08 - 0.34 * f, twist: f * 1.1 });

const MODULE_PLACES: readonly { floor: number; angle: number; dist: number; size: V3; lift?: number }[] = [
  { floor: 8, angle: 0.1, dist: 2.5, size: [0.95, 0.6, 0.7] },
  { floor: 6, angle: 3.0, dist: 2.3, size: [0.8, 0.5, 0.55] },
  { floor: 4, angle: 0.35, dist: 2.4, size: [0.8, 0.46, 0.6] },
  { floor: 14, angle: 3.4, dist: 1.95, size: [0.62, 0.4, 0.5] },
  { floor: 15, angle: 5.7, dist: 1.9, size: [0.7, 0.42, 0.52], lift: 0.62 },
];

export const towerModules = work.map((item, m) => {
  const { floor, angle, dist, size, lift = 0.16 } = MODULE_PLACES[m];
  const y = floorY(floor);
  return {
    id: item.id,
    label: item.label,
    tag: moduleTag(m),
    floor,
    angle,
    size,
    at: [Math.cos(angle) * dist, y, Math.sin(angle) * dist] as V3,
    labelAt: [Math.cos(angle) * dist, y + size[1] / 2 + lift, Math.sin(angle) * dist] as V3,
    uses: item.uses.map(techIndex),
    team: (item.team ?? []).map((label, i) => {
      const a = angle + (i - 1) * 0.5;
      return { label, at: [Math.cos(a) * (dist + 0.75), y + (i - 1) * 0.42, Math.sin(a) * (dist + 0.75)] as V3 };
    }),
  };
});

/** The service core: one column of technologies, in stack order from the ground up. */
export const towerTech = techList.map((t, i) => {
  const low = floorY(t.tier * 4);
  const band = floorY((t.tier + 1) * 4) - low;
  return {
    label: t.label,
    tag: techTag(i),
    at: [TOWER.column, low + ((t.slot + 0.5) / t.slots) * band, TOWER.column] as V3,
  };
});

export const towerTiers = tiers.map((tier, k) => {
  // Labelled on whichever corner of the twisting floor faces the viewer's right, so the tier name is never buried.
  // The lowest tier sits a floor higher, clear of the page's scroll hint.
  const floor = k === 0 ? 3 : k * 4 + 2;
  const { w, d, twist } = outerRect(floor / (TOWER.floors - 1));
  const c = Math.cos(twist);
  const s = Math.sin(twist);
  const corners = ([[-w, -d], [w, -d], [w, d], [-w, d]] as const).map(([x, z]) => [x * c - z * s, x * s + z * c] as const);
  const score = ([x, z]: readonly [number, number]) => x * Math.cos(TOWER.yaw) + z * Math.sin(TOWER.yaw);
  const [x, z] = corners.reduce((best, p) => (score(p) > score(best) ? p : best));
  return { label: tier.label, at: [x, floorY(floor), z] as V3 };
});

/* ---------------------------------------- About: four plates */
export const STRATA = { levels: [2.7, 0.9, -0.9, -2.7], R: 2.5 } as const;
export const engineeringLanes: readonly { z: number; left: string; right: string }[] = [
  { z: -1.5, left: "Next.js", right: "Angular" },
  { z: 0, left: "NestJS", right: "Express" },
  { z: 1.5, left: "MongoDB", right: "SQL" },
];
export const ENGINEERING_X = { left: -1.3, right: 0.75, rail: 1.95 } as const;
export const creativityArcs: readonly { label: string; ring: number }[] = [
  { label: "Video editors", ring: 2 },
  { label: "Videographers", ring: 4 },
  { label: "Graphic designers", ring: 6 },
];
export const creativityPoint = (ring: number): V3 => {
  const a = Math.PI / 4;
  const r = ring * 0.72;
  return [-STRATA.R + Math.cos(a) * r, STRATA.levels[1], -STRATA.R + Math.sin(a) * r];
};
export const leadershipSpokes: readonly { label: string; angle: number }[] = [
  { label: "Assign tasks", angle: 2.6 },
  { label: "Schedule meetings", angle: 4.7 },
  { label: "Client deliverables", angle: 0.5 },
];
export const spokePoint = (angle: number): V3 => [Math.cos(angle) * 1.95, STRATA.levels[3], Math.sin(angle) * 1.95];
export const TREE_START: V3 = [-2.3, STRATA.levels[2], -0.75];
/** Where the one route through the decision tree ends up: four rights from the start. */
export const TREE_END: V3 = [1.94, STRATA.levels[2], 1.37];

/* ---------------------------------------- BloodLink: the real request flow */
export const BLOOD = {
  patient: [-1.7, 0.4, 1.1] as V3,
  donor: [1.1, -0.1, -0.4] as V3,
  ground: -2.15,
  frames: [
    { label: "State", t: 0, r: 3.8 },
    { label: "District", t: 0.4, r: 2.3 },
    { label: "Sub-division", t: 0.75, r: 1.35 },
    { label: "City", t: 1, r: 0.7 },
  ],
} as const;
export const bloodFrame = (t: number): readonly [number, number] => [BLOOD.patient[0] * t, BLOOD.patient[2] * t];
export function arc(a: V3, b: V3, lift: number, n: number, zOffset = 0): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * lift,
      a[2] + (b[2] - a[2]) * t + zOffset,
    ] as V3;
  });
}

/* ---------------------------------------- ProLink: a post, reactions, a connection */
export const PRO = {
  author: { c: [-2.7, 0.15, 0.8] as V3, w: 0.74, h: 0.48 },
  post: { c: [0.15, 0.6, 0.6] as V3, w: 1.05, h: 0.74 },
  comments: [
    { c: [0.95, -0.72, 0.7] as V3, w: 0.72, h: 0.22 },
    { c: [0.95, -1.26, 0.7] as V3, w: 0.72, h: 0.22 },
  ],
  like: [1.2, -0.14, 0.6] as V3,
  readers: [
    { c: [3.0, 1.15, -0.6] as V3 },
    { c: [3.1, -0.65, -1.2] as V3 },
    { c: [2.3, -2.2, -1.2] as V3 },
    { c: [-1.0, 2.15, -2.2] as V3 },
    { c: [1.4, 2.2, -2.6] as V3 },
    { c: [3.3, -1.9, -2.2] as V3 },
    { c: [-1.5, -0.9, -2.8] as V3 },
  ],
  readerSize: { w: 0.66, h: 0.42 },
} as const;
export const avatarOf = (card: { c: V3; w: number; h: number }): V3 => [
  card.c[0] - card.w * 0.62,
  card.c[1] + card.h * 0.42,
  card.c[2],
];

/* ---------------------------------------- Wanderlust: the listings in the screenshots */
export const terrain = (x: number, z: number) => -1.25 + 0.28 * Math.sin(x * 0.5 + z * 0.22) + 0.18 * Math.cos(z * 0.4);
export const lane = (z: number) => Math.sin(z * 0.28) * 1.15;
export const listings: readonly { id: string; label: string; x: number; z: number; top: number }[] = [
  { id: "lake", label: "Lakeside house", x: -2.2, z: -0.2, top: 1.05 },
  { id: "cabin", label: "Timber cabin", x: -0.9, z: -2.6, top: 1.55 },
  { id: "villa", label: "Villa and pool", x: 0.4, z: -5, top: 1.3 },
];
export const listingAt = (l: (typeof listings)[number]): V3 => [l.x, terrain(l.x, l.z), l.z];

/* ---------------------------------------- Experience: one floor per job */
export const MAST = { prejestY: -1.6, thoughtflowY: 1.6, half: 0.45, bottom: -4.6, top: 4.6 } as const;
export const leaveWing: V3 = [-1.55, MAST.prejestY, 0];
export const attendanceWing: V3 = [1.55, MAST.prejestY, 0];
export const TEAM_ANGLES = [0.5, 2.6, 4.7] as const;
export const teamPoint = (a: number): V3 => [Math.cos(a) * 1.65, MAST.thoughtflowY, Math.sin(a) * 1.65];

/* ---------------------------------------- Achievements: BloodLink is what each form holds up */
export const PODIUM = { left: -3.4, right: 3.4, apexY: 2.55, screenY: 0.75 } as const;
export const miniNetwork: readonly V3[] = [
  [0, 0, 0],
  [0.48, 0.2, 0.16],
  [-0.42, 0.26, -0.12],
  [0.3, -0.34, -0.2],
  [-0.34, -0.3, 0.2],
  [0.02, 0.46, 0.1],
];

/* ---------------------------------------- Education: two levels under the tower */
export const FOUNDATION = { school: -2.3, degree: -0.75, schoolR: 2.9, degreeR: 2.05 } as const;

/* ---------------------------------------- Contact: everything so far, and an empty plot */
export const THRESHOLD = {
  base: -2.5,
  plot: [0, -2.5, -13.2] as V3,
  stops: work.map((item, i) => ({
    label: item.label,
    at: [i % 2 === 0 ? -1.3 : 1.3, 0.35, -1.6 - i * 2.4] as V3,
  })),
};

/* ---------------------------------------- Projected labels */
export interface ModelLabelSpec {
  id: string;
  text: string;
  at: V3;
  align?: "start" | "end";
  /** Brightens when this tag is lit. */
  tag?: number;
  /** Stays hidden until its tag is lit. */
  whenLit?: boolean;
}

const lifted = (at: V3, by: number): V3 => [at[0], at[1] + by, at[2]];
const prejest = experience.find((e) => e.id === "prejest")!;
const thoughtflow = experience.find((e) => e.id === "thoughtflow")!;
const blood = projects.find((p) => p.id === "bloodlink")!;

const AFTER_PREJEST: readonly PoseId[] = ["experience-prejest", "experience-thoughtflow"];

/** Non-interactive labels: the same facts are in the page's text, so these are decoration for assistive technology. */
export const LABEL_SETS: readonly { poses: readonly PoseId[]; labels: readonly ModelLabelSpec[] }[] = [
  {
    poses: ["about-engineering"],
    labels: [
      ...engineeringLanes.flatMap((lane2) => [
        { id: lane2.left, text: lane2.left, at: [ENGINEERING_X.left, STRATA.levels[0], lane2.z] as V3 },
        { id: lane2.right, text: lane2.right, at: [ENGINEERING_X.right, STRATA.levels[0], lane2.z] as V3 },
      ]),
      { id: "auth", text: "JWT, role-based access", at: [ENGINEERING_X.rail, STRATA.levels[0], 2.1] as V3, align: "end" },
    ],
  },
  {
    poses: ["about-creativity"],
    labels: creativityArcs.map((a) => ({ id: a.label, text: a.label, at: creativityPoint(a.ring) })),
  },
  {
    poses: ["about-problem-solving"],
    labels: [
      { id: "question", text: "Patients, donors, blood banks", at: TREE_START, align: "end" },
      { id: "answer", text: blood.title, at: TREE_END },
    ],
  },
  {
    poses: ["about-leadership"],
    labels: leadershipSpokes.map((s) => ({ id: s.label, text: s.label, at: spokePoint(s.angle) })),
  },
  {
    poses: ["bloodlink"],
    labels: [
      { id: "patient", text: "Patient", at: BLOOD.patient, align: "end" },
      { id: "donor", text: "Donor", at: BLOOD.donor },
      ...BLOOD.frames.map((f) => {
        const [x, z] = bloodFrame(f.t);
        return { id: f.label, text: f.label, at: [x - f.r, BLOOD.ground, z + f.r] as V3, tag: SEARCH_LABEL_TAG, whenLit: true };
      }),
    ],
  },
  {
    poses: ["prolink"],
    labels: [
      { id: "post", text: "Post", at: lifted(PRO.post.c, PRO.post.h + 0.16), tag: 0 },
      { id: "likes", text: "Likes", at: PRO.like, tag: 1, whenLit: true },
      { id: "comments", text: "Comments", at: [PRO.comments[1].c[0] + PRO.comments[1].w, PRO.comments[1].c[1], PRO.comments[1].c[2]], tag: 1, whenLit: true },
      { id: "connection", text: "New connection", at: [0.2, 2.2, 0.2], tag: 2, whenLit: true },
    ],
  },
  {
    poses: ["wanderlust"],
    labels: listings.map((l, i) => ({ id: l.id, text: l.label, at: lifted(listingAt(l), l.top), tag: i })),
  },
  {
    poses: AFTER_PREJEST,
    labels: [
      { id: "prejest", text: prejest.company, at: [MAST.half, MAST.prejestY + 0.8, 0] },
      { id: "leave", text: "Leave", at: lifted(leaveWing, 0.26) },
      { id: "attendance", text: "Attendance", at: lifted(attendanceWing, 0.6) },
    ],
  },
  {
    poses: ["experience-thoughtflow"],
    labels: [
      { id: "thoughtflow", text: thoughtflow.company, at: [MAST.half, MAST.thoughtflowY + 0.8, 0] },
      ...["Video editors", "Videographers", "Graphic designers"].map((text, i) => ({ id: text, text, at: teamPoint(TEAM_ANGLES[i]) })),
    ],
  },
  {
    poses: ["achievement-technovate"],
    labels: [{ id: achievements[0].id, text: `${blood.title}, first prize`, at: [PODIUM.left + 0.7, PODIUM.apexY, 0] }],
  },
  {
    poses: ["achievement-policy"],
    labels: [{ id: achievements[1].id, text: `${blood.title}, presented`, at: [PODIUM.right + 1.2, PODIUM.screenY, -1.7] }],
  },
  {
    poses: ["education"],
    labels: education.map((e, i) => ({
      id: e.year,
      text: `${e.year}  ${e.school}`,
      at: (i === 0
        ? [FOUNDATION.degreeR, FOUNDATION.degree, FOUNDATION.degreeR]
        : [FOUNDATION.schoolR, FOUNDATION.school, FOUNDATION.schoolR]) as V3,
      align: "end" as const,
    })),
  },
  {
    poses: ["contact"],
    labels: [
      ...THRESHOLD.stops.map((s, i) => ({ id: s.label, text: s.label, at: s.at, align: i % 2 === 0 ? ("end" as const) : ("start" as const) })),
      { id: "next", text: "Next: yours", at: lifted(THRESHOLD.plot, 1.0) },
    ],
  },
];

/* ---------------------------------------- Skills */
export interface SkillNodeLayout {
  id: string;
  label: string;
  cluster: string;
  clusterLabel: string;
  position: V3;
  nodeIndex: number;
  /** tag used by the beams touching this node */
  edges: number[];
  linked: string[];
}

export const clusterLayout: Record<string, { c: V3; r: number }> = {
  languages: { c: [-1.85, 1.45, -1.6], r: 0.98 },
  frontend: { c: [0.2, -1.05, 0.7], r: 1.08 },
  backend: { c: [2.35, 1.15, -0.5], r: 1.08 },
  databases: { c: [4.3, -1.35, -1.5], r: 0.72 },
  tools: { c: [-3.75, -0.95, -0.8], r: 0.95 },
};

/**
 * Node indices and edge tags are worked out here rather than while building, because the forms are built in a worker
 * and the labels, which need the same numbers, live on the main thread.
 */
export const skillLayout: SkillNodeLayout[] = (() => {
  const out: SkillNodeLayout[] = [];
  let nodeIndex = 0;
  let tag = 0;
  clusters.forEach((cluster) => {
    const { c, r } = clusterLayout[cluster.id];
    nodeIndex++; // the cluster's own hub
    const members = skills.filter((s) => s.cluster === cluster.id);
    members.forEach((s, i) => {
      const a = (i / members.length) * Math.PI * 2 + 0.6;
      out.push({
        id: s.id,
        label: s.label,
        cluster: cluster.id,
        clusterLabel: cluster.label,
        position: [c[0] + Math.cos(a) * r * 1.2, c[1] + Math.sin(a) * r * 0.92, c[2] + Math.sin(a * 2) * 0.28],
        nodeIndex: nodeIndex++,
        edges: [tag++],
        linked: [],
      });
    });
  });
  skillLinks.forEach(([from, to]) => {
    const P = out.find((s) => s.id === from);
    const Q = out.find((s) => s.id === to);
    if (!P || !Q) return;
    const t = tag++;
    P.edges.push(t);
    Q.edges.push(t);
    P.linked.push(Q.id);
    Q.linked.push(P.id);
  });
  return out;
})();
