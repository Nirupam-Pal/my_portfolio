import { experience } from "./experience";
import { projects, type ProjectId } from "./projects";

/**
 * What the hero tower is made of. The service core carries the stack, database at the bottom and frontend at the
 * top, and every module plugged into the tower is a real piece of work wired to the technologies it uses.
 */
export const tiers = [
  { id: "databases", label: "Databases", tech: ["SQL", "MongoDB"] },
  { id: "backend", label: "Backend", tech: ["Node.js", "Express.js", "NestJS", "Socket.IO"] },
  { id: "apis", label: "APIs & Auth", tech: ["RESTful APIs", "JWT Authentication"] },
  { id: "frontend", label: "Frontend", tech: ["Next.js", "React.js", "Angular", "TypeScript", "Tailwind CSS", "EJS", "Bootstrap"] },
] as const;

export const techList: readonly { label: string; tier: number; slot: number; slots: number }[] = tiers.flatMap((tier, t) =>
  tier.tech.map((label, slot) => ({ label, tier: t, slot, slots: tier.tech.length })),
);

const project = (id: ProjectId) => projects.find((p) => p.id === id)!;
const job = (id: string) => experience.find((e) => e.id === id)!;
const stackOf = (id: ProjectId) => project(id).stack;

export interface WorkItem {
  id: string;
  label: string;
  /** Technologies this work is wired to in the tower. Empty when the work is not software. */
  uses: readonly string[];
  /** People this work coordinates, drawn in place of technologies. */
  team?: readonly string[];
  note: string;
}

export const work: readonly WorkItem[] = [
  {
    id: "bloodlink",
    label: project("bloodlink").title,
    // JWT is listed among BloodLink's features rather than its stack line.
    uses: [...stackOf("bloodlink"), "JWT Authentication"],
    note: stackOf("bloodlink").join(" / "),
  },
  { id: "prolink", label: project("prolink").title, uses: stackOf("prolink"), note: stackOf("prolink").join(" / ") },
  { id: "wanderlust", label: project("wanderlust").title, uses: stackOf("wanderlust"), note: stackOf("wanderlust").join(" / ") },
  { id: "prejest", label: job("prejest").company, uses: ["Angular"], note: "Leave and Attendance module / Angular" },
  {
    id: "thoughtflow",
    label: job("thoughtflow").company,
    uses: [],
    team: ["Video editors", "Videographers", "Graphic designers"],
    note: "Coordinating video editors, videographers and graphic designers",
  },
];
