import type { FormId } from "./geometry";

type Vec3 = readonly [number, number, number];
type Vec2 = readonly [number, number];

export interface Pose {
  form: FormId;
  camera: Vec3;
  look: Vec3;
  /** Where the look target sits on screen, in viewport fractions from centre. */
  screen: Vec2;
  /** The same, for portrait screens. */
  screenPortrait: Vec2;
  /** Multiplies camera distance on portrait screens, so wide forms still fit. */
  portraitZoom: number;
  /** Canvas opacity on portrait screens, where text always sits over the model. */
  portraitOpacity: number;
  opacity: number;
  yaw: number;
  pitch: number;
  /** Amplitude of the ambient structural drift. */
  drift: number;
  tint: string;
  edgeA: string;
  edgeB: string;
  edge: number;
  pathA: string;
  pathB: string;
  key: string;
  rim: string;
  env: number;
  fog: Vec2;
  /** node colour for each node group */
  nodes: readonly string[];
  panel: string;
  glow: string;
  /** Beam and node groups to keep lit; all others dim. */
  highlight?: readonly number[];
  /** How strongly signals travel along the light paths. */
  signal?: number;
  /** Draws only the part of the form behind this plane: x, y, z of its normal, then its distance. */
  clip?: readonly [number, number, number, number];
  /** Steps through what this form acts out. `rest` is the level of everything not part of the story. */
  sequence?: {
    steps: number;
    period: number;
    rest: number;
    /** Runs only while something on the page holds a step, for forms that answer to hover. */
    manual?: boolean;
    /** Multiply the level of what a step lights, and of what it leaves out. */
    lit?: number;
    unlit?: number;
    /** How strongly a lit panel glows. */
    glow: number;
    /** Tagged panels only exist once their step has happened. */
    reveal?: boolean;
    /** What a step lights moves by this much, towards the viewer. */
    advance?: Vec3;
  };
  /** Colour washes behind the canvas. */
  wash: { steel?: number; crimson?: number; blue?: number; dusk?: number; gold?: number };
}

const TITANIUM = "#a4aaba";
const VIOLET = "#8b5cf6";
const SKY = "#38bdf8";

const base = {
  screen: [0, 0],
  screenPortrait: [0, 0],
  portraitZoom: 1.5,
  portraitOpacity: 0.55,
  opacity: 1,
  yaw: 0,
  pitch: 0,
  drift: 0.02,
  tint: TITANIUM,
  edgeA: VIOLET,
  edgeB: SKY,
  edge: 1,
  pathA: VIOLET,
  pathB: SKY,
  key: "#c9d4ff",
  rim: VIOLET,
  env: 1.25,
  fog: [9, 30],
  nodes: ["#b9a4ff", "#7dd3fc", "#f5f5f7", "#7dd3fc", "#f5f5f7", "#f5f5f7"],
  panel: "#7c8cff",
  glow: "#a8c8ff",
  wash: {},
} satisfies Partial<Pose>;

const bloodNodes = ["#ff6b7a", "#fff1f2", "#ff2d46", "#ff6b7a"];

const GOLD = {
  tint: "#b89a62",
  edgeA: "#f4cf85",
  edgeB: "#a57f3d",
  edge: 0.9,
  pathA: "#f4cf85",
  pathB: "#fff0cc",
  key: "#ffe7bd",
  rim: "#d9a441",
  env: 1.05,
  nodes: ["#ffe2a8", "#ffe2a8"],
  panel: "#d9b36a",
  glow: "#ffe2a8",
} as const;

const AI_VIEW = {
  ...base,
  screen: [-0.25, 0],
  screenPortrait: [0, 0.16],
  portraitZoom: 1.75,
  portraitOpacity: 0.72,
  edge: 1.2,
  drift: 0.022,
  nodes: ["#a78bfa", "#38bdf8", "#bae6fd"],
  fog: [9, 28],
  panel: "#8b5cf6",
  sequence: { steps: 19, period: 1, rest: 0.35, glow: 0, manual: true },
} as const;

const ABOUT_VIEW = { screen: [-0.28, 0], screenPortrait: [0, 0.2], portraitOpacity: 0.4, fog: [10, 30], sequence: { steps: 5, period: 1, rest: 0.45, glow: 0.3, manual: true } } as const;

export const POSES = {
  hero: {
    ...base,
    form: "core",
    camera: [0, 1.3, 16.8],
    look: [0.2, -0.2, 0],
    screen: [0.225, -0.09],
    screenPortrait: [0, 0.05],
    portraitOpacity: 0.72,
    portraitZoom: 2,
    yaw: -0.3,
    pitch: 0.03,
    drift: 0.03,
    sequence: { steps: 5, period: 3.6, rest: 1, glow: 0.3, lit: 0.72, unlit: 3 },
    glow: "#a8c8ff",
    fog: [11, 34],
    wash: { steel: 1 },
  },
  // Scrolling carries the camera in towards the code on the screen, and the application then opens up into the stack.
  through: {
    ...base,
    form: "core",
    camera: [1.2, 0.7, 7.4],
    look: [0, 0.1, -0.8],
    screen: [0.3, 0.04],
    screenPortrait: [0, 0],
    portraitZoom: 1.1,
    portraitOpacity: 0.4,
    yaw: -0.08,
    fog: [3, 15],
    edge: 1.4,
    drift: 0.01,
  },
  "about-stack": {
    ...base,
    ...ABOUT_VIEW,
    form: "ecosystemPacked",
    camera: [0, 1.5, 12.2],
    look: [0, -0.3, 0],
    yaw: 0.72,
  },
  "about-engineering": {
    ...base,
    ...ABOUT_VIEW,
    form: "ecosystem",
    camera: [0, 1.5, 17.6],
    look: [0.1, -0.35, 0],
    yaw: 0.52,
  },
  // The interface is where working next to creative teams shows.
  "about-creativity": {
    ...base,
    ...ABOUT_VIEW,
    form: "ecosystem",
    camera: [0.1, 1.2, 17.6],
    look: [0.1, -0.2, 0],
    yaw: 0.8,
    highlight: [0],
  },
  "about-problem-solving": {
    ...base,
    ...ABOUT_VIEW,
    form: "ecosystem",
    camera: [0.2, -0.8, 17],
    look: [0.2, -0.8, 0.8],
    yaw: 0.36,
    highlight: [4],
  },
  // Keeping all of it moving together: everything lit, seen whole.
  "about-leadership": {
    ...base,
    ...ABOUT_VIEW,
    form: "ecosystem",
    camera: [0, 2.2, 18.4],
    look: [0.1, -0.5, 0],
    yaw: 0.42,
    signal: 1.5,
  },
  // Arriving at the work: the network is already there, small and far away, waiting to be walked into.
  "work-intro": {
    ...base,
    form: "bloodlink",
    camera: [3.4, 3.4, 17.5],
    look: [0, -0.2, 0],
    screen: [0.27, 0],
    screenPortrait: [0, 0.26],
    portraitOpacity: 0.55,
    portraitZoom: 1.3,
    opacity: 0.75,
    yaw: 0.6,
    drift: 0.02,
    tint: "#6d3b43",
    edgeA: "#ff3048",
    edgeB: "#a30f25",
    edge: 0.7,
    pathA: "#ff3048",
    pathB: "#ff8a95",
    key: "#ffb3bc",
    rim: "#ff2d46",
    env: 0.35,
    nodes: bloodNodes,
    panel: "#ff3048",
    wash: { crimson: 0.3 },
  },
  bloodlink: {
    ...base,
    form: "bloodlink",
    camera: [1.8, 2.5, 10.4],
    look: [0, -0.2, 0],
    screen: [0.2, 0.02],
    screenPortrait: [0, 0.27],
    portraitOpacity: 0.9,
    portraitZoom: 1.45,
    yaw: 0.35,
    drift: 0.03,
    tint: "#6d3b43",
    edgeA: "#ff3048",
    edgeB: "#a30f25",
    edge: 0.9,
    pathA: "#ff3048",
    pathB: "#ff8a95",
    key: "#ffb3bc",
    rim: "#ff2d46",
    env: 0.45,
    nodes: bloodNodes,
    panel: "#ff3048",
    sequence: { steps: 4, period: 2.8, rest: 0.5, glow: 0.7, reveal: true },
    glow: "#ff8a95",
    wash: { crimson: 1 },
  },
  prolink: {
    ...base,
    form: "prolink",
    camera: [1.6, 0.7, 13.4],
    look: [0, 0, 0],
    // Far enough left that the comment panels, which sit low and right, clear the capture in the corner.
    screen: [0.11, 0.05],
    screenPortrait: [0, 0.24],
    portraitOpacity: 0.9,
    portraitZoom: 1.7,
    yaw: 0.22,
    drift: 0.035,
    tint: "#8f9bd8",
    edgeA: "#6366f1",
    edgeB: "#7dd3fc",
    edge: 1.1,
    pathA: "#8b7cf8",
    pathB: "#7dd3fc",
    key: "#c7d2fe",
    rim: "#6366f1",
    env: 0.7,
    nodes: ["#c7d2fe", "#a5b4fc", "#818cf8", "#7dd3fc"],
    panel: "#6c7bff",
    glow: "#a5b4fc",
    sequence: { steps: 3, period: 3.2, rest: 0.55, glow: 0.3, reveal: true },
    fog: [8, 24],
    wash: { blue: 1 },
  },
  wanderlust: {
    ...base,
    form: "wanderlust",
    camera: [0.5, 0.15, 6.6],
    look: [0.3, -0.55, -4],
    screen: [0.36, 0.02],
    screenPortrait: [0, 0.24],
    portraitOpacity: 0.9,
    portraitZoom: 1.9,
    yaw: 0,
    drift: 0.006,
    tint: "#a78f77",
    edgeA: "#ff9e5e",
    edgeB: "#c9745d",
    edge: 0.65,
    pathA: "#ffb26b",
    pathB: "#ffd9a8",
    key: "#ffcfa0",
    rim: "#e86a4a",
    env: 0.5,
    fog: [6, 21],
    nodes: ["#ffd9a8", "#ffb26b"],
    panel: "#ffc48a",
    glow: "#ffc27a",
    sequence: { steps: 3, period: 3.4, rest: 0.7, glow: 0.4 },
    wash: { dusk: 1 },
  },
  // The laptop again, now with the sites it put live. Hovering a card lights that site's window.
  freelance: {
    ...base,
    form: "freelance",
    camera: [0, 0.6, 25],
    look: [0, 0, 0],
    screen: [0.25, 0.19],
    screenPortrait: [0, 0.22],
    portraitZoom: 1.5,
    portraitOpacity: 0.32,
    yaw: -0.22,
    edge: 1.2,
    sequence: { steps: 4, period: 3, rest: 0.6, glow: 0.45, manual: true },
    fog: [11, 34],
  },
  // Behind the quotes: three frames on one thread, each with its quote mark. The current voice steps forward.
  testimonials: {
    ...base,
    form: "voices",
    camera: [0, 0.3, 15.5],
    look: [0, 0, 0],
    screen: [0, -0.07],
    screenPortrait: [0, 0.3],
    portraitZoom: 1.5,
    portraitOpacity: 0.3,
    opacity: 0.32,
    yaw: 0,
    drift: 0.01,
    tint: "#7d8299",
    edgeA: "#a5b4fc",
    edgeB: "#8b5cf6",
    edge: 0.8,
    pathA: "#8b5cf6",
    pathB: "#7dd3fc",
    key: "#c7d2fe",
    rim: "#8b5cf6",
    env: 0.6,
    nodes: ["#a5b4fc", "#7dd3fc"],
    panel: "#6f78c8",
    glow: "#a5b4fc",
    signal: 0.4,
    fog: [9, 26],
    sequence: { steps: 3, period: 1, rest: 0.5, unlit: 1.6, glow: 0.22, manual: true, advance: [0, 0, 0.9] },
    wash: { blue: 0.3 },
  },
  // The graph draws itself upward as the timeline is read, and the camera climbs with it.
  experience: {
    ...base,
    form: "gitgraph",
    camera: [0, -1.6, 12.6],
    look: [0, -1.5, 0],
    screen: [-0.27, 0],
    screenPortrait: [0.3, 0],
    portraitOpacity: 0.3,
    portraitZoom: 1.2,
    yaw: -0.34,
    edge: 1.3,
    env: 1,
    highlight: [0, 1, 2],
    clip: [0, 1, 0, -1.3],
  },
  "experience-prejest": {
    ...base,
    form: "gitgraph",
    camera: [0, -0.8, 12.4],
    look: [0.5, -1.2, 0],
    screen: [-0.27, 0],
    screenPortrait: [0.3, 0],
    portraitOpacity: 0.3,
    portraitZoom: 1.2,
    yaw: -0.18,
    edge: 1.3,
    env: 1,
    highlight: [0, 1],
    clip: [0, 1, 0, 0.35],
  },
  "experience-thoughtflow": {
    ...base,
    form: "gitgraph",
    camera: [0, 1.0, 14.2],
    look: [0, 0.2, 0],
    screen: [-0.27, 0],
    screenPortrait: [0.3, 0],
    portraitOpacity: 0.3,
    portraitZoom: 1.2,
    yaw: 0.12,
    edge: 1.3,
    env: 1,
    highlight: [0, 1, 2],
  },
  skills: {
    ...base,
    form: "constellation",
    camera: [0, 0.3, 15],
    look: [0.4, -0.1, -0.5],
    screen: [0.05, -0.015],
    screenPortrait: [0, 0],
    portraitZoom: 2.1,
    portraitOpacity: 0.55,
    drift: 0.018,
    nodes: ["#b9a4ff", "#7dd3fc", "#f5f5f7", "#d7dcff", "#8b5cf6"],
    panel: "#5a5f8c",
    fog: [8, 24],
    sequence: { steps: 21, period: 1, rest: 0.3, glow: 0, manual: true },
  },
  // The network assembling: first a tight seed of neurons, then the layers, then signals, then the depth.
  "ai-seed": {
    ...AI_VIEW,
    form: "neuralSeed",
    camera: [0, 0.2, 11],
    look: [0, 0, 0],
    yaw: 0,
    signal: 0,
  },
  "ai-connect": {
    ...AI_VIEW,
    form: "neural",
    camera: [0, 0.2, 16.4],
    look: [0, 0, 0],
    yaw: 0.04,
    signal: 0,
  },
  "ai-signal": {
    ...AI_VIEW,
    form: "neural",
    camera: [0, 0.8, 15.8],
    look: [0, 0, 0],
    yaw: -0.26,
    signal: 1.5,
  },
  "ai-depth": {
    ...AI_VIEW,
    form: "neural",
    camera: [-0.6, 1.5, 13.2],
    look: [0, 0, 0],
    yaw: -0.88,
    signal: 1.1,
  },
  "ai-calm": {
    ...AI_VIEW,
    form: "neural",
    camera: [0, 0.8, 16],
    look: [0, 0, 0],
    yaw: -0.42,
    signal: 0.5,
  },
  // A trophy in a laurel, in the middle of the page, with a medal and a screen hung either side. Hovering either steps it forward.
  milestones: {
    ...base,
    ...GOLD,
    form: "milestones",
    camera: [0, 0.7, 17.5],
    look: [0, 0.05, 0],
    screen: [0, -0.07],
    screenPortrait: [0, 0.27],
    portraitZoom: 2.85,
    portraitOpacity: 0.9,
    yaw: 0.14,
    drift: 0.012,
    edge: 1.15,
    env: 1,
    nodes: ["#ffe2a8", "#fff4dc"],
    signal: 1.2,
    fog: [13, 36],
    sequence: { steps: 2, period: 1, rest: 0.85, glow: 0.5, manual: true, advance: [0, 0.14, 0.9] },
    wash: { gold: 0.8 },
  },
  education: {
    ...base,
    form: "knowledge",
    camera: [0, 0.6, 14.4],
    look: [0.2, 0.1, 0],
    screen: [0.27, 0],
    screenPortrait: [0, 0],
    portraitZoom: 1.5,
    portraitOpacity: 0.3,
    yaw: 0.16,
    edge: 1,
    env: 1,
    drift: 0.018,
    nodes: ["#b9a4ff", "#7dd3fc"],
    fog: [9, 26],
  },
  contact: {
    ...base,
    form: "convergence",
    camera: [0, 0.8, 15.4],
    look: [0, 0.2, 0],
    screen: [0.31, 0.2],
    screenPortrait: [0, 0.2],
    portraitZoom: 1.6,
    portraitOpacity: 0.35,
    yaw: -0.3,
    drift: 0.02,
    edge: 1.3,
    env: 1.1,
    fog: [9, 28],
    glow: "#a8c8ff",
    nodes: ["#b9a4ff", "#7dd3fc"],
    signal: 1.3,
  },
} satisfies Record<string, Pose>;

export type PoseId = keyof typeof POSES;
export const POSE_IDS = Object.keys(POSES) as PoseId[];
export const isPoseId = (v: string | null | undefined): v is PoseId => !!v && v in POSES;
