/**
 * The system the 3D models are drawn from: what each layer of a full-stack application does, and what Nirupam uses
 * for it. The hero shows these as one application around a laptop, and the About section pulls the same layers apart.
 */
export const stackLayers = [
  {
    id: "frontend",
    label: "Frontend",
    tech: ["React", "Next.js", "Angular"],
    role: "What people see and use.",
  },
  {
    id: "api",
    label: "APIs & Authentication",
    tech: ["REST APIs", "JWT", "Socket.IO"],
    role: "How the layers talk, and who is allowed to.",
  },
  {
    id: "backend",
    label: "Backend",
    tech: ["Node.js", "Express.js", "NestJS"],
    role: "Where the rules and the processing live.",
  },
  {
    id: "database",
    label: "Database",
    tech: ["MongoDB", "SQL"],
    role: "Where the data is kept and found again.",
  },
  {
    id: "problem",
    label: "Problem Solving & System Design",
    tech: [],
    role: "Deciding what to build, and how the parts fit together.",
  },
] as const;

/** The parts of the hero's sculpture, in the order its sequence lights them. */
export const heroSystems = [
  { id: "frontend", label: "Frontend", note: "React / Next.js / Angular" },
  { id: "api", label: "APIs & Auth", note: "REST APIs / JWT / Socket.IO" },
  { id: "backend", label: "Backend", note: "Node.js / Express.js / NestJS" },
  { id: "database", label: "Database", note: "MongoDB / SQL" },
  { id: "ai", label: "AI & ML", note: "Currently exploring" },
] as const;
