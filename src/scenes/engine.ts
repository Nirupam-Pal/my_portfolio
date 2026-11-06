import * as THREE from "three";

import { COUNT, STRIDE, type Form, type FormId } from "./geometry";
import { litTagsFor, skillLayout } from "./layouts";
import { POSE_IDS, POSES, type Pose, type PoseId } from "./poses";
import { sceneStore as store } from "./store";

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** A pose with its colours parsed once, so per-frame blending allocates nothing. */
interface ResolvedPose {
  pose: Pose;
  form: Form;
  tint: THREE.Color;
  edgeA: THREE.Color;
  edgeB: THREE.Color;
  pathA: THREE.Color;
  pathB: THREE.Color;
  key: THREE.Color;
  rim: THREE.Color;
  panel: THREE.Color;
  glow: THREE.Color;
  nodes: THREE.Color[];
}

const PATH_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aAcross;
  attribute float aLength;
  attribute float aPathLevel;
  varying float vLevel;
  varying float vAcross;
  varying float vAlong;
  varying float vPhase;
  varying float vLen;
  varying float vDepth;
  varying float vHeight;
  void main() {
    vLevel = aPathLevel;
    vAcross = aAcross;
    vAlong = position.z + 0.5;
    vPhase = aPhase;
    vLen = aLength;
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vHeight = world.y;
    vec4 mv = modelViewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const PATH_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uFog;
  uniform float uOpacity;
  varying float vLevel;
  varying float vAcross;
  varying float vAlong;
  varying float vPhase;
  varying float vLen;
  varying float vDepth;
  varying float vHeight;
  void main() {
    float across = 1.0 - abs(vAcross);
    float core = pow(across, 7.0);
    float glow = pow(across, 2.2) * 0.14;
    float t = fract(uTime * 0.11 - vPhase - vAlong * vLen * 0.09);
    float pulse = smoothstep(0.86, 0.995, t) * (1.0 - smoothstep(0.995, 1.0, t));
    float fog = 1.0 - smoothstep(uFog.x, uFog.y, vDepth);
    vec3 color = mix(uColorA, uColorB, smoothstep(-3.5, 3.5, vHeight));
    float intensity = (core + glow) * (0.1 + pulse * 1.7) * vLevel;
    vec3 light = color * intensity * fog * uOpacity;
    gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)));
    #include <colorspace_fragment>
  }
`;

const NODE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPhaseNode;
  attribute float aLevel;
  uniform float uTime;
  varying vec2 vUv2;
  varying vec3 vColor;
  varying float vDepth;
  varying float vLight;
  void main() {
    vec4 center = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float radius = length(instanceMatrix[0].xyz);
    vec4 mv = modelViewMatrix * center;
    // Halo extends well beyond the visual core, so the quad is larger than the radius.
    mv.xy += position.xy * radius * 8.4;
    vUv2 = position.xy * 2.0;
    vColor = aColor;
    vDepth = -mv.z;
    // Nodes brighten in sequence, as though connections were being established.
    float wave = fract(uTime * 0.09 + aPhaseNode);
    vLight = aLevel * (0.72 + 0.65 * smoothstep(0.8, 0.97, wave) * (1.0 - smoothstep(0.97, 1.0, wave)));
    gl_Position = projectionMatrix * mv;
  }
`;

const NODE_FRAG = /* glsl */ `
  uniform vec2 uFog;
  uniform float uOpacity;
  varying vec2 vUv2;
  varying vec3 vColor;
  varying float vDepth;
  varying float vLight;
  void main() {
    float d = length(vUv2) * 4.2;
    if (d > 4.2) discard;
    float core = 1.0 - smoothstep(0.82, 0.96, d);
    float ring = (1.0 - smoothstep(0.03, 0.07, abs(d - 1.7))) * 0.2;
    float halo = pow(max(0.0, 1.0 - d / 4.2), 3.6) * 0.2;
    float fog = 1.0 - smoothstep(uFog.x, uFog.y, vDepth);
    vec3 light = vColor * (core * 1.15 + ring + halo) * vLight * fog * uOpacity;
    gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)));
    #include <colorspace_fragment>
  }
`;

const PANEL_VERT = /* glsl */ `
  attribute float aGlow;
  varying vec3 vNormal2;
  varying vec3 vView;
  varying vec2 vUv2;
  varying float vGlow;
  varying float vDepth;
  void main() {
    vUv2 = uv;
    vGlow = aGlow;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal2 = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const PANEL_FRAG = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uGlow;
  uniform vec2 uFog;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal2;
  varying vec3 vView;
  varying vec2 vUv2;
  varying float vGlow;
  varying float vDepth;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal2), normalize(vView))), 2.2);
        float edge = max(abs(vUv2.x - 0.5), abs(vUv2.y - 0.5)) * 2.0;
    float rim = smoothstep(0.96, 1.0, edge) * 0.05;
    float fog = 1.0 - smoothstep(uFog.x, uFog.y, vDepth);
    vec3 glass = uTint * (0.014 + f * 0.09 + rim);
    vec3 lit = uGlow * vGlow * (0.3 + 0.16 * vUv2.y);
    vec3 light = (glass * (1.0 - vGlow) + lit) * fog * uOpacity;
    gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)));
    #include <colorspace_fragment>
  }
`;

const STEEL_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vBox;
  varying float vLevel;
  varying float vHeight;
  varying float vDepth;
  void main() {
    vBox = uv;
    vLevel = instanceColor.r;
    vec4 local = instanceMatrix * vec4(position, 1.0);
    vHeight = local.y;
    vec4 world = modelMatrix * local;
    vWorld = world.xyz;
    // Beams are boxes with orthogonal axes, so scaling a face normal never tilts it.
    vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Brushed metal lit by an analytic studio: long strip lights reflected along each member, plus a key and a rim.
 * The same look as a prefiltered environment map, without its start-up cost or a heavyweight PBR shader.
 */
const STEEL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTint;
  uniform vec3 uEdgeA;
  uniform vec3 uEdgeB;
  uniform float uEdge;
  uniform vec3 uKey;
  uniform vec3 uRim;
  uniform float uEnv;
  uniform vec2 uFog;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vBox;
  varying float vLevel;
  varying float vHeight;
  varying float vDepth;

  float band(float x, float center, float width) {
    return 1.0 - smoothstep(0.0, width, abs(x - center));
  }

  vec3 studio(vec3 r) {
    vec3 c = vec3(0.006, 0.007, 0.012);
    c += vec3(0.91, 0.93, 1.0) * 3.4 * band(r.y, 0.86, 0.1);
    c += vec3(0.55, 0.36, 0.96) * 2.6 * band(r.x, -0.84, 0.12);
    c += vec3(0.22, 0.74, 0.97) * 2.2 * band(r.x, 0.82, 0.1);
    c += vec3(1.0) * 1.0 * band(r.y, -0.76, 0.06);
    c += vec3(0.87, 0.89, 1.0) * 1.8 * band(r.z, -0.9, 0.05);
    return c;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vWorld);
    // A box face has one normal, so the reflection is bent along the member to make highlights travel down it.
    vec3 r = normalize(reflect(-v, n) + 0.2 * sin(vWorld.yzx * 1.7));
    float fresnel = 0.4 + 0.6 * pow(1.0 - max(dot(n, v), 0.0), 4.0);
    vec3 color = uTint * studio(r) * uEnv * fresnel;
    color += uTint * uKey * (0.02 * max(dot(n, normalize(vec3(4.0, 7.0, 6.0))), 0.0) + 1.1 * pow(max(dot(r, normalize(vec3(4.0, 7.0, 6.0))), 0.0), 26.0));
    color += uTint * uRim * 1.3 * pow(max(dot(r, normalize(vec3(-6.0, 1.5, -5.0))), 0.0), 14.0);

    float edge = smoothstep(0.55, 1.0, max(abs(vBox.x - 0.5), abs(vBox.y - 0.5)) * 2.0);
    float scan = 0.28 + 0.72 * pow(0.5 + 0.5 * sin(vHeight * 0.85 - uTime * 0.28), 3.0);
    color += mix(uEdgeA, uEdgeB, smoothstep(-4.0, 4.0, vHeight)) * edge * scan * uEdge * 0.26;

    color *= vLevel;
    color = color / (1.0 + color * 0.3);
    color = mix(color, vec3(0.0024, 0.0027, 0.004), smoothstep(uFog.x, uFog.y, vDepth));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Two crossed quads along z: a cheap glowing line, visible from any angle. */
function crossedLineGeometry(): THREE.BufferGeometry {
  const positions = [
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5,
    0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5,
  ];
  const across = [-1, 1, 1, -1, -1, 1, 1, -1];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("aAcross", new THREE.Float32BufferAttribute(across, 1));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  return g;
}

function additive(params: THREE.ShaderMaterialParameters) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
    side: THREE.DoubleSide,
    toneMapped: false,
    ...params,
  });
}

const WASHES = ["steel", "crimson", "blue", "dusk", "gold"] as const;
type WashId = (typeof WASHES)[number];

/** 0 at both ends of a morph, 1 in the middle. */
const bump = (k: number) => 4 * k * (1 - k);

export class SculptureEngine {
  readonly group = new THREE.Group();
  private forms: Record<FormId, Form>;
  private resolved: Record<PoseId, ResolvedPose>;

  private beamMesh: THREE.InstancedMesh;
  private pathMesh: THREE.InstancedMesh;
  private panelMesh: THREE.InstancedMesh;
  private nodeMesh: THREE.InstancedMesh;
  private beamMaterial: THREE.ShaderMaterial;
  private pathMaterial: THREE.ShaderMaterial;
  private panelMaterial: THREE.ShaderMaterial;
  private nodeMaterial: THREE.ShaderMaterial;
  private brightness = new Float32Array(COUNT.beams).fill(1);
  private nodeLevel = new Float32Array(COUNT.nodes).fill(1);
  private pathLevel = new Float32Array(COUNT.paths).fill(1);
  private panelLevel = new Float32Array(COUNT.panels);
  private beamSeeds = new Float32Array(COUNT.beams);
  private pathSeeds = new Float32Array(COUNT.paths);
  private panelSeeds = new Float32Array(COUNT.panels);
  private nodeSeeds = new Float32Array(COUNT.nodes);
  private colorScratch = new THREE.Color();
  private colorScratch2 = new THREE.Color();
  private cameraPos = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private labelVec = new THREE.Vector3();
  private pointerX = 0;
  private pointerY = 0;
  private focusBeamTags = new Set<number>();
  private focusNodes = new Set<number>();
  private lastFocus: string | null = null;
  /** What the current step of a sequence lights up. */
  private litTags = new Set<number>();
  private litForm: FormId | null = null;
  private litKey = "";
  private sequenceForm: FormId | null = null;
  private sequenceClock = 0;
  private time = 0;
  private viewOffset = { w: 0, h: 0, x: 0, y: 0 };
  private washEls: Partial<Record<WashId, HTMLElement>> = {};
  private lastState = { a: "", b: "", mix: -1, assemble: -1, hover: null as readonly number[] | null, focus: null as string | null, lit: "" };
  private settling = 0;
  private canvasEl: HTMLElement | null = null;

  constructor(
    threeScene: THREE.Scene,
    forms: Record<FormId, Form>,
    /** Small screens hold their forms still, so instance data is only rewritten when something changes. */
    private readonly compact = false,
  ) {
    this.forms = forms;

    this.resolved = Object.fromEntries(
      POSE_IDS.map((id) => {
        const pose: Pose = POSES[id];
        return [
          id,
          {
            pose,
            form: this.forms[pose.form],
            tint: new THREE.Color(pose.tint),
            edgeA: new THREE.Color(pose.edgeA),
            edgeB: new THREE.Color(pose.edgeB),
            pathA: new THREE.Color(pose.pathA),
            pathB: new THREE.Color(pose.pathB),
            key: new THREE.Color(pose.key),
            rim: new THREE.Color(pose.rim),
            panel: new THREE.Color(pose.panel),
            glow: new THREE.Color(pose.glow),
            nodes: pose.nodes.map((c) => new THREE.Color(c)),
          } satisfies ResolvedPose,
        ];
      }),
    ) as Record<PoseId, ResolvedPose>;

    // Beams: reflective steel, with a light line tracing each edge.
    this.beamMaterial = new THREE.ShaderMaterial({
      vertexShader: STEEL_VERT,
      fragmentShader: STEEL_FRAG,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uTint: { value: new THREE.Color() },
        uEdgeA: { value: new THREE.Color() },
        uEdgeB: { value: new THREE.Color() },
        uEdge: { value: 1 },
        uKey: { value: new THREE.Color() },
        uRim: { value: new THREE.Color() },
        uEnv: { value: 1 },
        uFog: { value: new THREE.Vector2(9, 30) },
      },
    });
    this.beamMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.beamMaterial, COUNT.beams);
    this.beamMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT.beams * 3).fill(1), 3);
    this.beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.beamMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.beamMesh.frustumCulled = false;

    // Light paths.
    const pathGeometry = crossedLineGeometry();
    pathGeometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.paths), 1));
    pathGeometry.setAttribute("aLength", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.paths), 1));
    pathGeometry.setAttribute("aPathLevel", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.paths).fill(1), 1));
    this.pathMaterial = additive({
      vertexShader: PATH_VERT,
      fragmentShader: PATH_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uFog: { value: new THREE.Vector2(9, 30) },
        uOpacity: { value: 1 },
      },
    });
    this.pathMesh = new THREE.InstancedMesh(pathGeometry, this.pathMaterial, COUNT.paths);
    this.pathMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pathMesh.frustumCulled = false;
    this.pathMesh.renderOrder = 3;

    // Glass.
    const panelGeometry = new THREE.PlaneGeometry(2, 2);
    panelGeometry.setAttribute("aGlow", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.panels), 1));
    this.panelMaterial = additive({
      vertexShader: PANEL_VERT,
      fragmentShader: PANEL_FRAG,
      uniforms: {
        uTint: { value: new THREE.Color() },
        uGlow: { value: new THREE.Color() },
        uFog: { value: new THREE.Vector2(9, 30) },
        uOpacity: { value: 1 },
        uTime: { value: 0 },
      },
    });
    this.panelMesh = new THREE.InstancedMesh(panelGeometry, this.panelMaterial, COUNT.panels);
    this.panelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.panelMesh.frustumCulled = false;
    this.panelMesh.renderOrder = 2;

    // Nodes: billboards drawing a core, a thin ring and a soft halo.
    const nodeGeometry = new THREE.PlaneGeometry(1, 1);
    const phases = new Float32Array(COUNT.nodes);
    for (let i = 0; i < COUNT.nodes; i++) phases[i] = (i * 0.618) % 1;
    nodeGeometry.setAttribute("aColor", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.nodes * 3), 3));
    nodeGeometry.setAttribute("aPhaseNode", new THREE.InstancedBufferAttribute(phases, 1));
    nodeGeometry.setAttribute("aLevel", new THREE.InstancedBufferAttribute(new Float32Array(COUNT.nodes).fill(1), 1));
    this.nodeMaterial = additive({
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      uniforms: { uTime: { value: 0 }, uFog: { value: new THREE.Vector2(9, 30) }, uOpacity: { value: 1 } },
    });
    this.nodeMesh = new THREE.InstancedMesh(nodeGeometry, this.nodeMaterial, COUNT.nodes);
    this.nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.nodeMesh.frustumCulled = false;
    this.nodeMesh.renderOrder = 4;

    // Stagger seeds: mostly height-ordered (members arrive floor by floor), with a little noise.
    for (let i = 0; i < COUNT.beams; i++) {
      this.beamSeeds[i] = clamp01((i / COUNT.beams) * 0.82 + ((i * 7.13) % 1) * 0.18);
    }
    for (let i = 0; i < COUNT.paths; i++) this.pathSeeds[i] = (i * 0.381) % 1;
    for (let i = 0; i < COUNT.panels; i++) this.panelSeeds[i] = (i * 0.618) % 1;
    for (let i = 0; i < COUNT.nodes; i++) this.nodeSeeds[i] = (i * 0.272) % 1;

    this.group.add(this.beamMesh, this.panelMesh, this.pathMesh, this.nodeMesh);
    threeScene.add(this.group);

    if (typeof document !== "undefined") {
      WASHES.forEach((k) => {
        this.washEls[k] = document.getElementById(`wash-${k}`) ?? undefined;
      });
    }
  }

  setCanvasElement(el: HTMLElement | null) {
    this.canvasEl = el;
  }

  /** Per-instance transition progress: floors move in sequence rather than all at once. */
  private staggered(mix: number, seed: number, spread: number) {
    if (mix <= 0) return 0;
    if (mix >= 1) return 1;
    return smoothstep(clamp01((mix * (1 + spread) - seed * spread) / 1));
  }

  private writeBeams(a: Form, b: Form, mix: number, assemble: number, drift: number) {
    const m = this.beamMesh.instanceMatrix.array as Float32Array;
    const scatter = this.forms.scatter.beams;
    const A = a.beams;
    const B = b.beams;
    const t = this.time;
    const assembling = assemble < 1;

    for (let i = 0; i < COUNT.beams; i++) {
      const o = i * STRIDE.beams;
      const seed = this.beamSeeds[i];
      const k = this.staggered(mix, seed, 0.65);
      let ax = lerp(A[o], B[o], k);
      let ay = lerp(A[o + 1], B[o + 1], k);
      let az = lerp(A[o + 2], B[o + 2], k);
      let bx = lerp(A[o + 3], B[o + 3], k);
      let by = lerp(A[o + 4], B[o + 4], k);
      let bz = lerp(A[o + 5], B[o + 5], k);
      // Members thin to drawn lines while travelling, so a morph reads as a sketch, never as rubble.
      let th = lerp(A[o + 6], B[o + 6], k) * (1 - 0.68 * bump(k));

      if (assembling) {
        const q = this.staggered(assemble, seed, 1.1);
        ax = lerp(scatter[o], ax, q);
        ay = lerp(scatter[o + 1], ay, q);
        az = lerp(scatter[o + 2], az, q);
        bx = lerp(scatter[o + 3], bx, q);
        by = lerp(scatter[o + 4], by, q);
        bz = lerp(scatter[o + 5], bz, q);
        th = lerp(scatter[o + 6], th, q);
      }

      if (drift > 0) {
        const wa = Math.sin(t * 0.42 + ay * 0.9) * drift;
        const wb = Math.sin(t * 0.42 + by * 0.9) * drift;
        ax += wa;
        bx += wb;
        az += wa * 0.6;
        bz += wb * 0.6;
      }

      let dx = bx - ax;
      let dy = by - ay;
      let dz = bz - az;
      const len = Math.hypot(dx, dy, dz);
      const j = i * 16;
      if (len < 1e-4 || th < 1e-4) {
        m.fill(0, j, j + 16);
        m[j + 15] = 1;
        continue;
      }
      dx /= len;
      dy /= len;
      dz /= len;
      // Basis around the beam axis, chosen so beams keep a stable roll.
      const useX = Math.abs(dy) > 0.98;
      const ux = useX ? 1 : 0;
      const uy = useX ? 0 : 1;
      let xx = uy * dz;
      let xy = -ux * dz;
      let xz = ux * dy - uy * dx;
      const xl = Math.hypot(xx, xy, xz) || 1;
      xx /= xl;
      xy /= xl;
      xz /= xl;
      const yx = dy * xz - dz * xy;
      const yy = dz * xx - dx * xz;
      const yz = dx * xy - dy * xx;
      m[j] = xx * th;
      m[j + 1] = xy * th;
      m[j + 2] = xz * th;
      m[j + 3] = 0;
      m[j + 4] = yx * th;
      m[j + 5] = yy * th;
      m[j + 6] = yz * th;
      m[j + 7] = 0;
      m[j + 8] = dx * len;
      m[j + 9] = dy * len;
      m[j + 10] = dz * len;
      m[j + 11] = 0;
      m[j + 12] = (ax + bx) / 2;
      m[j + 13] = (ay + by) / 2;
      m[j + 14] = (az + bz) / 2;
      m[j + 15] = 1;
    }
    this.beamMesh.instanceMatrix.needsUpdate = true;
  }

  private writePaths(pa: ResolvedPose, pb: ResolvedPose, mix: number, assemble: number, dt: number) {
    const a = pa.form;
    const b = pb.form;
    const m = this.pathMesh.instanceMatrix.array as Float32Array;
    const phases = this.pathMesh.geometry.getAttribute("aPhase") as THREE.InstancedBufferAttribute;
    const lengths = this.pathMesh.geometry.getAttribute("aLength") as THREE.InstancedBufferAttribute;
    const levels = this.pathMesh.geometry.getAttribute("aPathLevel") as THREE.InstancedBufferAttribute;
    const current = mix < 0.5 ? pa : pb;
    const A = a.paths;
    const B = b.paths;
    // Light switches off mid-morph and comes back when the new form has settled.
    const presence = Math.pow(Math.abs(mix * 2 - 1), 2) * smoothstep(clamp01((assemble - 0.72) / 0.28));
    const width = 0.05 * presence;

    for (let i = 0; i < COUNT.paths; i++) {
      const o = i * STRIDE.paths;
      const k = this.staggered(mix, this.pathSeeds[i], 0.3);
      const ax = lerp(A[o], B[o], k);
      const ay = lerp(A[o + 1], B[o + 1], k);
      const az = lerp(A[o + 2], B[o + 2], k);
      const bx = lerp(A[o + 3], B[o + 3], k);
      const by = lerp(A[o + 4], B[o + 4], k);
      const bz = lerp(A[o + 5], B[o + 5], k);
      let dx = bx - ax;
      let dy = by - ay;
      let dz = bz - az;
      const len = Math.hypot(dx, dy, dz);
      const j = i * 16;
      phases.array[i] = mix < 0.5 ? A[o + 6] : B[o + 6];
      lengths.array[i] = len;
      this.pathLevel[i] = damp(this.pathLevel[i], this.sequenceLevel(current, current.form.pathTags[i], 4, 0.18, 1), 7, dt);
      levels.array[i] = this.pathLevel[i];
      if (len < 1e-4 || width < 1e-4) {
        m.fill(0, j, j + 16);
        m[j + 15] = 1;
        continue;
      }
      dx /= len;
      dy /= len;
      dz /= len;
      const useX = Math.abs(dy) > 0.98;
      const ux = useX ? 1 : 0;
      const uy = useX ? 0 : 1;
      let xx = uy * dz;
      let xy = -ux * dz;
      let xz = ux * dy - uy * dx;
      const xl = Math.hypot(xx, xy, xz) || 1;
      xx /= xl;
      xy /= xl;
      xz /= xl;
      m[j] = xx * width;
      m[j + 1] = xy * width;
      m[j + 2] = xz * width;
      m[j + 3] = 0;
      m[j + 4] = (dy * xz - dz * xy) * width;
      m[j + 5] = (dz * xx - dx * xz) * width;
      m[j + 6] = (dx * xy - dy * xx) * width;
      m[j + 7] = 0;
      m[j + 8] = dx * len;
      m[j + 9] = dy * len;
      m[j + 10] = dz * len;
      m[j + 11] = 0;
      m[j + 12] = (ax + bx) / 2;
      m[j + 13] = (ay + by) / 2;
      m[j + 14] = (az + bz) / 2;
      m[j + 15] = 1;
    }
    this.pathMesh.instanceMatrix.needsUpdate = true;
    phases.needsUpdate = true;
    lengths.needsUpdate = true;
    levels.needsUpdate = true;
  }

  private writePanels(pa: ResolvedPose, pb: ResolvedPose, mix: number, assemble: number, dt: number) {
    const a = pa.form;
    const b = pb.form;
    const current = mix < 0.5 ? pa : pb;
    const m = this.panelMesh.instanceMatrix.array as Float32Array;
    const glowAttr = this.panelMesh.geometry.getAttribute("aGlow") as THREE.InstancedBufferAttribute;
    const A = a.panels;
    const B = b.panels;
    const arrive = smoothstep(clamp01((assemble - 0.55) / 0.45));

    for (let i = 0; i < COUNT.panels; i++) {
      const o = i * STRIDE.panels;
      const k = this.staggered(mix, this.panelSeeds[i], 0.4);
      const cx = lerp(A[o], B[o], k);
      const cy = lerp(A[o + 1], B[o + 1], k);
      const cz = lerp(A[o + 2], B[o + 2], k);
      const tag = current.form.panelTags[i];
      const sequence = this.litForm === current.pose.form ? current.pose.sequence : undefined;
      const on = tag >= 0 && sequence && this.litTags.has(tag) ? 1 : 0;
      this.panelLevel[i] = damp(this.panelLevel[i], on, 7, dt);
      const reveal = tag >= 0 && sequence?.reveal ? this.panelLevel[i] : 1;
      const size = arrive * (1 - 0.92 * bump(k)) * reveal;
      const ux = lerp(A[o + 3], B[o + 3], k) * size;
      const uy = lerp(A[o + 4], B[o + 4], k) * size;
      const uz = lerp(A[o + 5], B[o + 5], k) * size;
      const vx = lerp(A[o + 6], B[o + 6], k) * size;
      const vy = lerp(A[o + 7], B[o + 7], k) * size;
      const vz = lerp(A[o + 8], B[o + 8], k) * size;
      // A lit panel in a sequence glows on top of whatever glow it has at rest.
      glowAttr.array[i] = Math.min(1, lerp(A[o + 9], B[o + 9], k) + this.panelLevel[i] * (sequence?.glow ?? 0));

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-6) {
        nx = 0;
        ny = 0;
        nz = 0;
      } else {
        nx /= nl;
        ny /= nl;
        nz /= nl;
      }
      m.set([ux, uy, uz, 0, vx, vy, vz, 0, nx, ny, nz, 0, cx, cy, cz, 1], i * 16);
    }
    this.panelMesh.instanceMatrix.needsUpdate = true;
    glowAttr.needsUpdate = true;
  }

  private writeNodes(pa: ResolvedPose, pb: ResolvedPose, mix: number, assemble: number, dt: number) {
    const m = this.nodeMesh.instanceMatrix.array as Float32Array;
    const colorAttr = this.nodeMesh.geometry.getAttribute("aColor") as THREE.InstancedBufferAttribute;
    const levelAttr = this.nodeMesh.geometry.getAttribute("aLevel") as THREE.InstancedBufferAttribute;
    const A = pa.form.nodes;
    const B = pb.form.nodes;
    const GA = pa.form.nodeGroups;
    const GB = pb.form.nodeGroups;
    const arrive = smoothstep(clamp01((assemble - 0.6) / 0.4));
    const hover = store.hoverGroups;
    const hasFocus = store.focusSkill !== null;
    const white = this.colorScratch2.set("#ffffff");
    const current = mix < 0.5 ? pa : pb;
    const groupsLit = current.pose.form === "bloodlink" ? hover : null;

    for (let i = 0; i < COUNT.nodes; i++) {
      const o = i * STRIDE.nodes;
      const k = this.staggered(mix, this.nodeSeeds[i], 0.5);
      const r = lerp(A[o + 3], B[o + 3], k) * arrive;
      const j = i * 16;
      m[j] = r;
      m[j + 5] = r;
      m[j + 10] = r;
      m[j + 15] = 1;
      m[j + 12] = lerp(A[o], B[o], k);
      m[j + 13] = lerp(A[o + 1], B[o + 1], k);
      m[j + 14] = lerp(A[o + 2], B[o + 2], k);

      const ca = pa.nodes[GA[i] % pa.nodes.length] ?? white;
      const cb = pb.nodes[GB[i] % pb.nodes.length] ?? white;
      const c = this.colorScratch.copy(ca).lerp(cb, k);
      colorAttr.array[i * 3] = c.r;
      colorAttr.array[i * 3 + 1] = c.g;
      colorAttr.array[i * 3 + 2] = c.b;

      const group = mix < 0.5 ? GA[i] : GB[i];
      let target = this.sequenceLevel(current, current.form.nodeTags[i], 2.4, 0.3, 1);
      if (current.pose.highlight && !current.pose.highlight.includes(group)) target = 0.12;
      if (groupsLit) target = groupsLit.includes(group) ? 1.9 : 0.22;
      if (hasFocus) target = this.focusNodes.has(i) ? 2 : 0.16;
      this.nodeLevel[i] = damp(this.nodeLevel[i], target, 9, dt);
      levelAttr.array[i] = this.nodeLevel[i];
    }
    this.nodeMesh.instanceMatrix.needsUpdate = true;
    colorAttr.needsUpdate = true;
    levelAttr.needsUpdate = true;
  }

  /**
   * The level of one tagged instance under the current step of a sequence.
   * With no step running (reduced motion, say) everything stays at its normal level, so the whole model still reads.
   */
  private sequenceLevel(p: ResolvedPose, tag: number, lit: number, unlit: number, normal: number) {
    const sequence = p.pose.sequence;
    if (!sequence || this.litForm !== p.pose.form) return normal;
    if (tag < 0) return sequence.rest;
    return this.litTags.has(tag) ? lit : unlit;
  }

  private beamLevel(p: ResolvedPose, i: number): number {
    if (p.form.beamGroups[i] === 255) return 1;
    const group = p.form.beamGroups[i];
    if (store.focusSkill && p.pose.form === "constellation") {
      const tag = p.form.beamTags[i];
      if (tag < 0) return 0.22;
      return this.focusBeamTags.has(tag) ? 3.2 : 0.14;
    }
    if (p.pose.form === "constellation") return group === 5 ? 0.5 : 0.85;
    if (store.hoverGroups && p.pose.form === "bloodlink") {
      return store.hoverGroups.includes(group) ? 1.8 : 0.28;
    }
    if (p.pose.highlight) return p.pose.highlight.includes(group) || group === 4 ? (group === 4 ? 0.5 : 1.4) : 0.16;
    return this.sequenceLevel(p, p.form.beamTags[i], 2.8, 0.22, 1);
  }

  private writeBrightness(pa: ResolvedPose, pb: ResolvedPose, mix: number, dt: number) {
    const col = this.beamMesh.instanceColor!;
    const arr = col.array as Float32Array;
    for (let i = 0; i < COUNT.beams; i++) {
      const target = lerp(this.beamLevel(pa, i), this.beamLevel(pb, i), mix);
      const v = damp(this.brightness[i], target, 6, dt);
      this.brightness[i] = v;
      arr[i * 3] = v;
      arr[i * 3 + 1] = v;
      arr[i * 3 + 2] = v;
    }
    col.needsUpdate = true;
  }

  private refreshFocus() {
    if (store.focusSkill === this.lastFocus) return;
    this.lastFocus = store.focusSkill;
    this.focusBeamTags.clear();
    this.focusNodes.clear();
    if (!store.focusSkill) return;
    const skill = skillLayout.find((s) => s.id === store.focusSkill);
    if (!skill) return;
    skill.edges.forEach((e) => this.focusBeamTags.add(e));
    this.focusNodes.add(skill.nodeIndex);
    skill.linked.forEach((id) => {
      const n = skillLayout.find((s) => s.id === id);
      if (n) this.focusNodes.add(n.nodeIndex);
    });
  }

  /** Moves the current form's sequence on, and tells the 3D and the page about the step it has reached. */
  private updateSequence(dt: number, current: ResolvedPose, reduced: boolean, settled: boolean) {
    const { form, sequence } = current.pose;
    if (form !== this.sequenceForm) {
      this.sequenceForm = form;
      this.sequenceClock = 0;
    }
    const pin = store.pin?.form === form ? store.pin.step : null;
    // It waits for the form to arrive, so nobody walks in halfway through the story.
    if (sequence && pin === null && !reduced && !store.sequencePaused && settled) this.sequenceClock += dt;
    const step = pin ?? (sequence && !reduced ? Math.floor(this.sequenceClock / sequence.period) % sequence.steps : null);

    const key = step === null ? "" : `${form}:${step}`;
    if (key === this.litKey) return;
    this.litKey = key;
    this.litForm = step === null ? null : form;
    this.litTags.clear();
    if (step !== null) litTagsFor(form, step).forEach((tag) => this.litTags.add(tag));

    store.labelLayers.forEach((layer) => {
      layer.items.forEach(({ el, tag }) => {
        if (tag !== undefined) el.toggleAttribute("data-lit", step !== null && this.litTags.has(tag));
      });
    });
    store.stepHosts.get(form)?.forEach((host) => {
      host.dataset.step = step === null ? "none" : String(step);
      host.querySelectorAll("[data-step-item]").forEach((item, i) => item.toggleAttribute("data-active", i === step));
    });
  }

  private updateLabels(camera: THREE.PerspectiveCamera, width: number, height: number, mix: number, portrait: boolean, assemble: number) {
    if (store.labelLayers.size === 0) return;
    let projected = false;
    for (const layer of store.labelLayers) {
      const weight = portrait || assemble < 0.92
        ? 0
        : (layer.poses.includes(store.poseA) ? 1 - mix : 0) + (layer.poses.includes(store.poseB) ? mix : 0);
      const visible = weight > 0.55;
      layer.el.style.visibility = visible ? "visible" : "hidden";
      layer.el.style.opacity = String(smoothstep(clamp01((weight - 0.55) / 0.45)));
      if (!visible) continue;
      if (!projected) {
        this.group.updateMatrixWorld();
        projected = true;
      }
      for (const { el, at } of layer.items.values()) {
        const v = this.labelVec.set(at[0], at[1], at[2]);
        v.applyMatrix4(this.group.matrixWorld).project(camera);
        const x = (v.x * 0.5 + 0.5) * width;
        const y = (-v.y * 0.5 + 0.5) * height;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    }
  }

  update(dt: number, camera: THREE.PerspectiveCamera, width: number, height: number) {
    const reduced = store.reducedMotion;
    if (!reduced) this.time += dt;
    const t = this.time;

    let mix = store.mix;
    if (reduced) mix = mix < 0.5 ? 0 : 1;
    const pa = this.resolved[store.poseA];
    const pb = this.resolved[store.poseB];
    const A = pa.pose;
    const B = pb.pose;

    const portrait = width / height < 0.9;
    const assemble = reduced ? 1 : store.assemble;

    this.refreshFocus();
    this.updateSequence(dt, mix < 0.5 ? pa : pb, reduced, (mix === 0 || mix === 1) && assemble >= 1);

    const drift = reduced || this.compact ? 0 : lerp(A.drift, B.drift, mix);

    const last = this.lastState;
    // Moving the steel is the expensive write. A change of light alone leaves it where it is.
    const moved = last.a !== store.poseA || last.b !== store.poseB || last.mix !== mix || last.assemble !== assemble;
    const changed =
      moved ||
      last.hover !== store.hoverGroups ||
      last.focus !== store.focusSkill ||
      last.lit !== this.litKey;
    if (changed) {
      last.a = store.poseA;
      last.b = store.poseB;
      last.mix = mix;
      last.assemble = assemble;
      last.hover = store.hoverGroups;
      last.focus = store.focusSkill;
      last.lit = this.litKey;
      // Long enough for damped brightness to finish arriving after the last change.
      this.settling = 1.6;
    } else {
      this.settling -= dt;
    }
    if (drift > 0 || moved) this.writeBeams(pa.form, pb.form, mix, assemble, drift);
    if (drift > 0 || this.settling > 0) {
      this.writePaths(pa, pb, mix, assemble, reduced ? 1 : dt);
      this.writePanels(pa, pb, mix, assemble, reduced ? 1 : dt);
      this.writeNodes(pa, pb, mix, assemble, reduced ? 1 : dt);
      this.writeBrightness(pa, pb, mix, reduced ? 1 : dt);
    }

    // Pointer response is damped, so the object feels heavy rather than twitchy.
    const fine = !portrait && !reduced;
    this.pointerX = damp(this.pointerX, fine ? store.pointerX : 0, 2.6, dt);
    this.pointerY = damp(this.pointerY, fine ? store.pointerY : 0, 2.6, dt);

    if (!store.dragging && B.form !== "constellation") store.dragYaw = damp(store.dragYaw, 0, 3, dt);

    const sway = reduced ? 0 : Math.sin(t * 0.09) * 0.05;
    // The entrance: the structure turns into place while the camera settles back to its mark.
    const arrival = 1 - smoothstep(assemble);
    this.group.rotation.set(
      lerp(A.pitch, B.pitch, mix) + this.pointerY * 0.05,
      lerp(A.yaw, B.yaw, mix) + sway + this.pointerX * 0.14 + store.dragYaw - arrival * 0.55,
      0,
    );

    // Camera.
    const zoom = portrait ? lerp(A.portraitZoom, B.portraitZoom, mix) : 1;
    const look = this.lookTarget.set(
      lerp(A.look[0], B.look[0], mix),
      lerp(A.look[1], B.look[1], mix),
      lerp(A.look[2], B.look[2], mix),
    );
    const cam = this.cameraPos.set(
      lerp(A.camera[0], B.camera[0], mix),
      lerp(A.camera[1], B.camera[1], mix),
      lerp(A.camera[2], B.camera[2], mix),
    );
    cam.sub(look).multiplyScalar(zoom * (1 - arrival * 0.14)).add(look);
    cam.x += this.pointerX * 0.28;
    cam.y += this.pointerY * 0.18;

    // A hovered skill eases the camera towards its node, keeping the rest in frame.
    if (store.focusSkill && B.form === "constellation") {
      const skill = skillLayout.find((s) => s.id === store.focusSkill);
      if (skill) {
        look.x += skill.position[0] * 0.09;
        look.y += skill.position[1] * 0.09;
      }
    }
    camera.position.copy(cam);
    camera.lookAt(look);

    const sx = portrait ? lerp(A.screenPortrait[0], B.screenPortrait[0], mix) : lerp(A.screen[0], B.screen[0], mix);
    const sy = portrait ? lerp(A.screenPortrait[1], B.screenPortrait[1], mix) : lerp(A.screen[1], B.screen[1], mix);
    const vo = this.viewOffset;
    const ox = Math.round(-sx * width);
    const oy = Math.round(sy * height);
    if (vo.w !== width || vo.h !== height || vo.x !== ox || vo.y !== oy) {
      vo.w = width;
      vo.h = height;
      vo.x = ox;
      vo.y = oy;
      camera.setViewOffset(width, height, ox, oy, width, height);
    }

    // Materials and light.
    const lerpColor = (target: THREE.Color, a: THREE.Color, b: THREE.Color) => target.copy(a).lerp(b, mix);
    const near = lerp(A.fog[0], B.fog[0], mix) * zoom;
    const far = lerp(A.fog[1], B.fog[1], mix) * zoom;

    const steel = this.beamMaterial.uniforms;
    steel.uTime.value = t;
    lerpColor(steel.uTint.value, pa.tint, pb.tint);
    lerpColor(steel.uEdgeA.value, pa.edgeA, pb.edgeA);
    lerpColor(steel.uEdgeB.value, pa.edgeB, pb.edgeB);
    steel.uEdge.value = lerp(A.edge, B.edge, mix);
    lerpColor(steel.uKey.value, pa.key, pb.key);
    lerpColor(steel.uRim.value, pa.rim, pb.rim);
    steel.uEnv.value = lerp(A.env, B.env, mix);
    steel.uFog.value.set(near, far);

    const path = this.pathMaterial.uniforms;
    path.uTime.value = t;
    lerpColor(path.uColorA.value, pa.pathA, pb.pathA);
    lerpColor(path.uColorB.value, pa.pathB, pb.pathB);
    path.uFog.value.set(near, far);

    const panel = this.panelMaterial.uniforms;
    panel.uTime.value = t;
    lerpColor(panel.uTint.value, pa.panel, pb.panel);
    lerpColor(panel.uGlow.value, pa.glow, pb.glow);
    panel.uFog.value.set(near, far);

    const node = this.nodeMaterial.uniforms;
    node.uTime.value = t;
    node.uFog.value.set(near, far);

    // Page-level effects, written as opacity only so they stay on the compositor.
    const opacityA = portrait ? A.portraitOpacity : A.opacity;
    const opacityB = portrait ? B.portraitOpacity : B.opacity;
    // Between two different forms the whole sculpture recedes a little, keeping attention on the page.
    const recede = A.form === B.form ? 1 : 1 - 0.38 * bump(mix);
    if (this.canvasEl) this.canvasEl.style.opacity = (lerp(opacityA, opacityB, mix) * recede).toFixed(3);
    WASHES.forEach((k) => {
      const el = this.washEls[k];
      if (el) el.style.opacity = lerp(A.wash[k] ?? 0, B.wash[k] ?? 0, mix).toFixed(3);
    });

    this.updateLabels(camera, width, height, mix, portrait, assemble);
  }

  dispose() {
    this.group.removeFromParent();
    for (const mesh of [this.beamMesh, this.pathMesh, this.panelMesh, this.nodeMesh]) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    }
  }
}
