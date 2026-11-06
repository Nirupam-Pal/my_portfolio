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
  /** Steps through what this form acts out. `rest` is the level of everything not part of the story. */
  sequence?: {
    steps: number;
    period: number;
    rest: number;
    /** How strongly a lit panel glows. */
    glow: number;
    /** Tagged panels only exist once their step has happened. */
    reveal?: boolean;
  };
  /** Colour washes behind the canvas. */
  wash: { steel?: number; crimson?: number; blue?: number; dusk?: number; gold?: number };
}

const STEEL = "#aab0c0";
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
  tint: STEEL,
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
  glow: "#ffd9a8",
  wash: {},
} satisfies Partial<Pose>;

const bloodNodes = ["#ff6b7a", "#fff1f2", "#ff2d46", "#ff6b7a"];
const goldNodes = ["#ffe2a8", "#ffe2a8"];

export const POSES = {
  hero: {
    ...base,
    form: "tower",
    camera: [0, -3.6, 13.6],
    look: [0, 0.35, 0],
    screen: [0.285, 0],
    screenPortrait: [0.14, 0.06],
    portraitOpacity: 0.7,
    portraitZoom: 1.3,
    yaw: 0.42,
    pitch: 0.02,
    sequence: { steps: 5, period: 3.6, rest: 1, glow: 0.42 },
    glow: "#a8c8ff",
    wash: { steel: 1 },
  },
  through: {
    ...base,
    form: "tower",
    camera: [0.2, -1.2, 0.95],
    look: [0, 3.2, -0.2],
    screen: [0, 0],
    screenPortrait: [0, 0],
    portraitZoom: 1,
    yaw: 1.5,
    fog: [3, 13],
    edge: 1.5,
    drift: 0.01,
  },
  "about-engineering": {
    ...base,
    form: "strata",
    camera: [7.4, 7.6, 10.8],
    look: [0, 2.3, 0],
    screen: [0.25, 0],
    screenPortrait: [0, 0.2],
    yaw: 0.45,
    highlight: [0],
    fog: [8, 26],
  },
  "about-creativity": {
    ...base,
    form: "strata",
    camera: [6.6, 5.2, 11.4],
    look: [0, 0.6, 0],
    screen: [0.25, 0],
    screenPortrait: [0, 0.2],
    yaw: 0.2,
    highlight: [1],
    fog: [8, 26],
  },
  "about-problem-solving": {
    ...base,
    form: "strata",
    camera: [5.8, 2.8, 11.7],
    look: [0, -1.0, 0],
    screen: [0.25, 0],
    screenPortrait: [0, 0.2],
    yaw: -0.05,
    highlight: [2],
    fog: [8, 26],
  },
  "about-leadership": {
    ...base,
    form: "strata",
    camera: [5.0, 0.8, 11.8],
    look: [0, -2.4, 0],
    screen: [0.25, 0],
    screenPortrait: [0, 0.2],
    yaw: -0.3,
    highlight: [3],
    fog: [8, 26],
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
  // The flagship's opening plate: close enough to stand inside the network, behind the name.
  "bloodlink-open": {
    ...base,
    form: "bloodlink",
    camera: [0.4, 0.9, 6.6],
    look: [0, 0, 0],
    screen: [0.04, 0.03],
    screenPortrait: [0, 0.24],
    portraitOpacity: 0.9,
    portraitZoom: 1.45,
    yaw: 0.12,
    drift: 0.03,
    tint: "#6d3b43",
    edgeA: "#ff3048",
    edgeB: "#a30f25",
    edge: 1.1,
    pathA: "#ff3048",
    pathB: "#ff8a95",
    key: "#ffb3bc",
    rim: "#ff2d46",
    env: 0.45,
    nodes: bloodNodes,
    panel: "#ff3048",
    sequence: { steps: 4, period: 2.8, rest: 0.5, glow: 0.7, reveal: true },
    glow: "#ff8a95",
    fog: [4, 20],
    wash: { crimson: 1.25 },
  },
  bloodlink: {
    ...base,
    form: "bloodlink",
    camera: [1.8, 2.5, 10.4],
    look: [0, -0.2, 0],
    screen: [0.2, 0.02],
    screenPortrait: [0, 0.24],
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
    camera: [-1.6, 0.7, 10.6],
    look: [0, 0, 0],
    screen: [-0.21, 0.02],
    screenPortrait: [0, 0.24],
    portraitOpacity: 0.9,
    portraitZoom: 1.7,
    yaw: -0.22,
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
    portraitZoom: 1.12,
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
  experience: {
    ...base,
    form: "mast",
    camera: [0, -0.4, 12.5],
    look: [0, 0, 0],
    screen: [0.27, 0],
    screenPortrait: [0.38, 0],
    portraitOpacity: 0.4,
    portraitZoom: 1.15,
    yaw: 0.5,
    edge: 1.3,
    env: 0.7,
    highlight: [0],
  },
  // The camera climbs the mast with the timeline, and each floor stays lit once it has been reached.
  "experience-prejest": {
    ...base,
    form: "mast",
    camera: [0, 0.6, 10.6],
    look: [0, -1.6, 0],
    screen: [0.3, 0],
    screenPortrait: [0.38, 0],
    portraitOpacity: 0.4,
    portraitZoom: 1.15,
    yaw: 0.28,
    edge: 1.3,
    env: 0.8,
    highlight: [0, 1],
  },
  "experience-thoughtflow": {
    ...base,
    form: "mast",
    camera: [0, 3.2, 11],
    look: [0, 1.6, 0],
    screen: [0.3, 0],
    screenPortrait: [0.38, 0],
    portraitOpacity: 0.4,
    portraitZoom: 1.15,
    yaw: -0.1,
    edge: 1.3,
    env: 0.8,
    highlight: [0, 1, 2],
  },
  skills: {
    ...base,
    form: "constellation",
    camera: [0, 0.3, 12.4],
    look: [0.1, -0.1, -0.5],
    screen: [0.11, 0.05],
    screenPortrait: [0, 0],
    portraitZoom: 2.1,
    portraitOpacity: 0.55,
    drift: 0.018,
    nodes: ["#b9a4ff", "#7dd3fc", "#f5f5f7", "#d7dcff", "#8b5cf6"],
    panel: "#5a5f8c",
    fog: [8, 22],
  },
  "achievement-technovate": {
    ...base,
    form: "podium",
    camera: [-1.9, 0.6, 10.2],
    look: [-3.4, 0.25, 0],
    screen: [0.24, 0],
    screenPortrait: [0, 0.14],
    portraitZoom: 1.2,
    portraitOpacity: 0.65,
    yaw: 0.12,
    tint: "#b89a62",
    edgeA: "#f4cf85",
    edgeB: "#a57f3d",
    edge: 0.9,
    pathA: "#f4cf85",
    pathB: "#fff0cc",
    key: "#ffe7bd",
    rim: "#d9a441",
    env: 1.05,
    nodes: goldNodes,
    panel: "#d9b36a",
    glow: "#ffe2a8",
    highlight: [0],
    wash: { gold: 1 },
  },
  "achievement-policy": {
    ...base,
    form: "podium",
    camera: [1.9, 1.2, 10.2],
    look: [3.4, -0.9, 0],
    screen: [0.24, 0],
    screenPortrait: [0, 0.14],
    portraitZoom: 1.2,
    portraitOpacity: 0.65,
    yaw: -0.1,
    tint: "#b89a62",
    edgeA: "#f4cf85",
    edgeB: "#a57f3d",
    edge: 0.9,
    pathA: "#f4cf85",
    pathB: "#fff0cc",
    key: "#ffe7bd",
    rim: "#d9a441",
    env: 1.05,
    nodes: goldNodes,
    panel: "#d9b36a",
    glow: "#ffe2a8",
    highlight: [1],
    wash: { gold: 0.75 },
  },
  education: {
    ...base,
    form: "foundation",
    camera: [5.5, 5.4, 11.6],
    look: [0, -1.1, 0],
    screen: [0.24, -0.02],
    screenPortrait: [0, 0],
    portraitZoom: 1.2,
    portraitOpacity: 0.3,
    yaw: 0.2,
    edge: 0.9,
    env: 0.8,
    drift: 0,
    panel: "#2a2f66",
    nodes: ["#b9a4ff", "#7dd3fc"],
    fog: [9, 26],
  },
  contact: {
    ...base,
    form: "portal",
    camera: [0, -0.6, 7.6],
    look: [0, 0.05, -6],
    screen: [0.22, 0.02],
    screenPortrait: [0, -0.02],
    portraitZoom: 1.25,
    portraitOpacity: 0.55,
    drift: 0.004,
    edge: 1.35,
    env: 1,
    fog: [7, 24],
    glow: "#a8c8ff",
    nodes: ["#b9a4ff", "#dbeafe"],
  },
} satisfies Record<string, Pose>;

export type PoseId = keyof typeof POSES;
export const POSE_IDS = Object.keys(POSES) as PoseId[];
export const isPoseId = (v: string | null | undefined): v is PoseId => !!v && v in POSES;
