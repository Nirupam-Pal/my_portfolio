/**
 * Where the portfolio's real content sits inside the 3D forms. Plain numbers and strings with no builder code,
 * so DOM labels can be projected onto the same points the forms draw, on the main thread and in the worker alike.
 */
import { aiLayers } from "@/data/ai";
import { achievements, education } from "@/data/profile";
import { experience } from "@/data/experience";
import { freelanceProjects } from "@/data/freelance";
import { projects } from "@/data/projects";
import { clusters, skillLinks, skills } from "@/data/skills";
import { heroSystems, stackLayers } from "@/data/stack";

import type { PoseId } from "./poses";

export type V3 = readonly [number, number, number];

/* ---------------------------------------- Tags: what lights up together */
/** Labels that only belong to the first step of BloodLink's flow. */
export const SEARCH_LABEL_TAG = 10;
/** A skill's own node is tagged with its index; these are the links between skills and the category names. */
export const skillLinkTag = (i: number) => 100 + i;
export const clusterTag = (i: number) => 500 + i;
/** A neuron is tagged with its index; these are the connections between them. */
export const synapseTag = (i: number) => 100 + i;

/** The tags lit by a step of a form's sequence. */
export function litTagsFor(form: string, step: number): number[] {
  switch (form) {
    case "bloodlink": {
      const tags = Array.from({ length: step + 1 }, (_, i) => i);
      return step === 0 ? [...tags, SEARCH_LABEL_TAG] : tags;
    }
    case "prolink":
      return Array.from({ length: step + 1 }, (_, i) => i);
    case "neural":
      return neuralLitTags(step);
    case "constellation":
      return skillLitTags(step);
    default:
      return [step];
  }
}

/** Where the camera leans while a step is held. */
export function focusPointFor(form: string, step: number): V3 | null {
  if (form === "constellation") return skillLayout[step]?.position ?? null;
  if (form === "neural") return neurons[step]?.at ?? null;
  return null;
}

/* ---------------------------------------- Hero: a developer's laptop, and the application it is building */
const LID_TILT = 0.26;
const LID_HEIGHT = 2.2;
const HINGE: V3 = [0, -0.95, -1.05];
const LID_THICKNESS = 0.07;
export const LAPTOP = {
  width: 3.4,
  depth: 2.2,
  baseY: -1.0,
  baseHeight: 0.1,
  hinge: HINGE,
  lidTop: [0, HINGE[1] + Math.cos(LID_TILT) * LID_HEIGHT, HINGE[2] - Math.sin(LID_TILT) * LID_HEIGHT] as V3,
  lidThickness: LID_THICKNESS,
  tilt: LID_TILT,
  screen: { w: 3.14, h: 1.96 },
  /** Halfway up the lid, just proud of its face. */
  screenCentre: [
    0,
    HINGE[1] + Math.cos(LID_TILT) * LID_HEIGHT * 0.5 + Math.sin(LID_TILT) * (LID_THICKNESS / 2 + 0.012),
    HINGE[2] - Math.sin(LID_TILT) * LID_HEIGHT * 0.5 + Math.cos(LID_TILT) * (LID_THICKNESS / 2 + 0.012),
  ] as V3,
  /** The forms with the laptop in them, at the size each one builds it. */
  scales: { core: 1, convergence: 0.9, freelance: 0.8 } as Partial<Record<string, number>>,
} as const;

export const CORE = {
  frontend: [-2.95, 1.28, 0.75] as V3,
  backend: [3.45, -0.1, -0.2] as V3,
  database: [0.15, -2.55, 0.35] as V3,
  gateway: [2.3, -0.5, -0.08] as V3,
  ai: [2.25, 2.3, -0.8] as V3,
} as const;

/** Each name sits just outside its part, on the side with open space, so it never lands on the geometry. */
const HERO_LABEL_AT: Record<string, { at: V3; end?: boolean }> = {
  frontend: { at: [-4.07, 1.9, 0.75], end: true },
  api: { at: [1.95, -1.3, -0.1] },
  backend: { at: [3.75, -1.3, -0.2] },
  database: { at: [1.45, -3.1, 0.35] },
  ai: { at: [2.05, 3.2, -0.8] },
};

export const heroLabels = heroSystems.map((system, tag) => ({ ...system, tag, ...HERO_LABEL_AT[system.id] }));

/* ---------------------------------------- About: the same system, pulled apart */
export const ECOSYSTEM = {
  spread: 1.95,
  packed: 0.46,
  problem: [-0.3, -2.42, 1.5] as V3,
  labelY: 1.62,
} as const;
export const layerX = (i: number, spread: number) => (i - 1.5) * spread;
/** Where each technology sits on its plate, in the plate's own y and z. */
export const layerTech: readonly (readonly [number, number])[][] = [
  [[0.6, -0.72], [0.6, 0.05], [0.6, 0.82]],
  [[0.72, 0], [-0.36, -0.62], [-0.36, 0.62]],
  [[0.8, -0.72], [-0.02, 0.5], [-0.82, -0.6]],
  [[0.72, -0.78], [0.72, 0.78]],
];
const layerLabels = stackLayers.slice(0, 4).flatMap((layer, i) => [
  { id: layer.id, text: layer.label, at: [layerX(i, ECOSYSTEM.spread), ECOSYSTEM.labelY + (i % 2) * 0.28, -1.1] as V3, tag: i },
  ...layer.tech.map((tech, t) => {
    const [y, z] = layerTech[i][t];
    return { id: `${layer.id}-${tech}`, text: tech, at: [layerX(i, ECOSYSTEM.spread), y, z] as V3, tag: i, whenLit: true };
  }),
]);

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

/* ---------------------------------------- Wanderlust: the listings in the screenshots, on a map */
export const MAP = { y: -1.45, x: 4.6, nearZ: 2.4, farZ: -6.4, search: [-0.6, 2.3, -3.2] as V3 } as const;
export const listings: readonly { id: string; label: string; x: number; z: number; lift: number }[] = [
  { id: "lake", label: "Lakeside house", x: -1.3, z: 0.7, lift: 2.0 },
  { id: "cabin", label: "Timber cabin", x: 0.75, z: -1.4, lift: 2.75 },
  { id: "villa", label: "Villa and pool", x: 2.75, z: 0.1, lift: 2.15 },
];
export const pinAt = (l: (typeof listings)[number]): V3 => [l.x, MAP.y, l.z];
export const cardAt = (l: (typeof listings)[number]): V3 => [l.x, MAP.y + l.lift, l.z];
export const CARD = { w: 0.86, h: 0.62 } as const;

/* ---------------------------------------- Freelance: the laptop, and the sites that went live from it */
export const CLIENT_SITES: readonly V3[] = [
  [-1.95, 2.25, 0.2],
  [1.95, 2.25, 0.2],
  [-1.95, -2.3, 0.4],
  [1.95, -2.3, 0.4],
];
export const CLIENT_WINDOW = { w: 0.86, h: 0.6 } as const;

/* ---------------------------------------- Experience: a branching history */
export const GIT = {
  bottom: -3.6,
  top: 3.7,
  start: -3.1,
  prejestFork: -2.2,
  leave: [1.75, -1.55, 0.55] as V3,
  attendance: [1.75, -0.75, 0.55] as V3,
  merge: -0.05,
  thoughtflow: 0.85,
  now: 3.35,
  teams: [
    { label: "Video editors", at: [-1.45, 1.6, 0.4] as V3 },
    { label: "Videographers", at: [-1.45, 2.26, -0.3] as V3 },
    { label: "Graphic designers", at: [-1.45, 2.92, 0.4] as V3 },
  ],
} as const;

/* ---------------------------------------- Achievements: BloodLink's network, recognised twice */
export const MILESTONE = { left: -9, right: 9, y: 0.1 } as const;
export const miniNetwork: readonly V3[] = [
  [0, 0, 0],
  [0.96, 0.4, 0.32],
  [-0.84, 0.52, -0.24],
  [0.6, -0.68, -0.4],
  [-0.68, -0.6, 0.4],
  [0.04, 0.92, 0.2],
];

/* ---------------------------------------- Education: a graph that grows towards the degree */
export const KNOWLEDGE = {
  school: [-1.45, -1.4, 0.1] as V3,
  degree: [1.05, 0.9, 0.3] as V3,
  schoolInfo: [
    { label: "Science Stream", at: [-1.75, 0.15, -0.5] as V3 },
    { label: "Class 12: 83%", at: [0.1, -2.35, 0.7] as V3 },
  ],
  degreeInfo: [
    { label: "B.Tech Computer Science", at: [-0.25, 2.5, -0.5] as V3 },
    { label: "GPA 8.5 / 10", at: [2.1, -0.5, 0.3] as V3, end: true },
  ],
} as const;

/* ---------------------------------------- Contact: everything converging on one point */
export const CONVERGE = {
  streams: [
    { label: "Technologies", from: [-2.9, 2.05, -1.4] as V3, to: [-1.1, 0.98, -1.5] as V3 },
    { label: "Experiences", from: [1.9, 2.05, -1.8] as V3, to: [0.9, 0.98, -1.5] as V3 },
    { label: "Ideas", from: [2.6, -1.5, -1.2] as V3, to: [1.5, -0.9, 0] as V3 },
  ],
} as const;

/* ---------------------------------------- AI and ML: a small network, nothing more than it claims */
const LAYER_X = [-3.3, -1.1, 1.1, 3.3];
const LAYER_RADIUS = [1.25, 2.05, 2.05, 0.95];
const LAYER_DEPTH = 0.62;
/** Turns each ring so no two of its neurons line up one behind the other when seen from the front. */
const LAYER_PHASE = [0.5, 0.26, 0.26, 0];

export const neurons: readonly { at: V3; layer: number }[] = aiLayers.flatMap((layer, l) =>
  Array.from({ length: layer.nodes }, (_, n) => {
    const a = (n / layer.nodes) * Math.PI * 2 + LAYER_PHASE[l];
    const r = LAYER_RADIUS[l];
    return { layer: l, at: [LAYER_X[l], Math.sin(a) * r, Math.cos(a) * r * LAYER_DEPTH] as V3 };
  }),
);
export const neuralRing = (l: number): { x: number; r: number; depth: number } => ({ x: LAYER_X[l], r: LAYER_RADIUS[l], depth: LAYER_DEPTH });

/** Every neuron feeds every neuron in the next layer. */
export const synapses: readonly (readonly [number, number])[] = neurons.flatMap((from, i) =>
  neurons.flatMap((to, j) => (to.layer === from.layer + 1 ? [[i, j] as const] : [])),
);

function neuralLitTags(step: number) {
  const out = [step];
  synapses.forEach(([a, b], s) => {
    if (a !== step && b !== step) return;
    out.push(synapseTag(s), a === step ? b : a);
  });
  return out;
}

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

const prejest = experience.find((e) => e.id === "prejest")!;
const thoughtflow = experience.find((e) => e.id === "thoughtflow")!;
const blood = projects.find((p) => p.id === "bloodlink")!;
const lifted = (at: V3, by: number): V3 => [at[0], at[1] + by, at[2]];

const AFTER_PREJEST: readonly PoseId[] = ["experience-prejest", "experience-thoughtflow"];
const ABOUT: readonly PoseId[] = ["about-engineering", "about-creativity", "about-problem-solving", "about-leadership"];
const AI_LABELS: readonly PoseId[] = ["ai-signal", "ai-depth", "ai-calm"];

/** Non-interactive labels: the same facts are in the page's text, so these are decoration for assistive technology. */
export const LABEL_SETS: readonly { poses: readonly PoseId[]; labels: readonly ModelLabelSpec[] }[] = [
  {
    poses: ABOUT,
    labels: [
      ...layerLabels,
      { id: "problem", text: stackLayers[4].label, at: [ECOSYSTEM.problem[0] - 1.15, ECOSYSTEM.problem[1] + 0.1, ECOSYSTEM.problem[2]], tag: 4, align: "end" },
    ],
  },
  {
    poses: ["bloodlink"],
    labels: [
      { id: "patient", text: "Patient", at: BLOOD.patient, align: "end" },
      { id: "donor", text: "Donor", at: BLOOD.donor, align: "end" },
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
    labels: [
      ...listings.map((l, i) => ({ id: l.id, text: l.label, at: lifted(cardAt(l), CARD.h + 0.14), tag: i })),
      { id: "search", text: "Search results", at: lifted(MAP.search, 0.42), align: "end" as const },
    ],
  },
  {
    poses: ["freelance"],
    labels: freelanceProjects.map((project, i) => ({
      id: project.id,
      text: project.title,
      // The windows on the right read back across themselves, so a long name can't run off the screen.
      at: [CLIENT_SITES[i][0] + (i % 2 ? CLIENT_WINDOW.w : -CLIENT_WINDOW.w), CLIENT_SITES[i][1] + CLIENT_WINDOW.h + 0.2, CLIENT_SITES[i][2]] as V3,
      align: i % 2 ? ("end" as const) : ("start" as const),
      tag: i,
    })),
  },
  {
    poses: AFTER_PREJEST,
    labels: [
      { id: "prejest", text: `${prejest.company} / ${prejest.role}`, at: [0.35, GIT.prejestFork, 0], align: "end" },
      { id: "leave", text: "Leave module", at: GIT.leave },
      { id: "attendance", text: "Attendance module", at: GIT.attendance },
    ],
  },
  {
    poses: ["experience-thoughtflow"],
    labels: [
      { id: "thoughtflow", text: `${thoughtflow.company} / ${thoughtflow.role}`, at: [0.35, GIT.thoughtflow, 0] },
      ...GIT.teams.map((t) => ({ id: t.label, text: t.label, at: t.at, align: "end" as const })),
    ],
  },
  {
    poses: AI_LABELS,
    labels: aiLayers.map((layer, l) => ({ id: `layer-${l}`, text: layer.label, at: [LAYER_X[l], -LAYER_RADIUS[l] - 0.45, 0] as V3 })),
  },
  {
    poses: ["achievement-technovate"],
    labels: [{ id: achievements[0].id, text: `${blood.title}, first prize`, at: [MILESTONE.left - 0.75, MILESTONE.y + 1.32, 0] }],
  },
  {
    poses: ["achievement-policy"],
    labels: [{ id: achievements[1].id, text: `${blood.title}, presented`, at: [MILESTONE.right - 0.62, MILESTONE.y + 1.1, 0] }],
  },
  {
    poses: ["education"],
    labels: [
      ...education.map((e, i) => ({
        id: e.year,
        text: `${e.year}  ${e.school}`,
        // The degree is on the right of the model, so its long name reads back across it rather than off the screen.
        at: (i === 0 ? [KNOWLEDGE.degree[0] + 0.8, KNOWLEDGE.degree[1] + 0.62, KNOWLEDGE.degree[2]] : lifted(KNOWLEDGE.school, -0.62)) as V3,
        align: i === 0 ? ("end" as const) : ("start" as const),
      })),
      ...[...KNOWLEDGE.schoolInfo, ...KNOWLEDGE.degreeInfo].map((n) => ({
        id: n.label,
        text: n.label,
        at: n.at,
        align: "end" in n ? ("end" as const) : ("start" as const),
      })),
    ],
  },
  {
    poses: ["contact"],
    labels: CONVERGE.streams.map((s) => ({ id: s.label, text: s.label, at: s.from, align: s.from[0] > 0 ? ("end" as const) : ("start" as const) })),
  },
];

/* ---------------------------------------- Skills */
export interface SkillNodeLayout {
  id: string;
  label: string;
  cluster: string;
  position: V3;
}

export const clusterLayout: Record<string, { c: V3; r: number; phase?: number; labelBelow?: boolean }> = {
  languages: { c: [-1.5, 1.45, -1.4], r: 0.98 },
  frontend: { c: [0.15, -1.25, 0.5], r: 1.08 },
  backend: { c: [1.7, 1.35, -0.5], r: 1.0 },
  databases: { c: [3.2, -1.6, -1.0], r: 0.72 },
  tools: { c: [-4.1, -1.15, -0.8], r: 0.95 },
  ai: { c: [4.5, 0.95, -1.2], r: 0.86, phase: 0.95, labelBelow: true },
};

/** Worked out here rather than while building, because the forms are built in a worker and the labels need the same positions. */
export const skillLayout: SkillNodeLayout[] = (() => {
  const out: SkillNodeLayout[] = [];
  clusters.forEach((cluster) => {
    const { c, r, phase = 0.6 } = clusterLayout[cluster.id];
    const members = skills.filter((s) => s.cluster === cluster.id);
    members.forEach((s, i) => {
      const a = (i / members.length) * Math.PI * 2 + phase;
      out.push({
        id: s.id,
        label: s.label,
        cluster: cluster.id,
        position: [c[0] + Math.cos(a) * r * 1.2, c[1] + Math.sin(a) * r * 0.92, c[2] + Math.sin(a * 2) * 0.28],
      });
    });
  });
  return out;
})();

export const clusterLabels = clusters.map((cluster, i) => {
  const { c, r, labelBelow } = clusterLayout[cluster.id];
  return { id: cluster.id, text: cluster.label, tag: clusterTag(i), at: [c[0], c[1] + (r * 0.92 + 0.34) * (labelBelow ? -1 : 1), c[2]] as V3 };
});

function skillLitTags(step: number) {
  const skill = skillLayout[step];
  if (!skill) return [];
  const out = [step, clusterTag(clusters.findIndex((c) => c.id === skill.cluster))];
  skillLinks.forEach(([from, to], i) => {
    if (from !== skill.id && to !== skill.id) return;
    out.push(skillLinkTag(i));
    out.push(skillLayout.findIndex((s) => s.id === (from === skill.id ? to : from)));
  });
  return out;
}
