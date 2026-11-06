export type ClusterId = "languages" | "frontend" | "backend" | "databases" | "tools";

export interface Skill {
  id: string;
  label: string;
  cluster: ClusterId;
}

export const clusters: readonly { id: ClusterId; label: string }[] = [
  { id: "languages", label: "Languages" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "databases", label: "Databases" },
  { id: "tools", label: "Tools & Concepts" },
];

export const skills: readonly Skill[] = [
  { id: "js", label: "JavaScript", cluster: "languages" },
  { id: "ts", label: "TypeScript", cluster: "languages" },
  { id: "java", label: "Java", cluster: "languages" },
  { id: "python", label: "Python", cluster: "languages" },
  { id: "react", label: "React.js", cluster: "frontend" },
  { id: "next", label: "Next.js", cluster: "frontend" },
  { id: "angular", label: "Angular", cluster: "frontend" },
  { id: "tailwind", label: "Tailwind CSS", cluster: "frontend" },
  { id: "node", label: "Node.js", cluster: "backend" },
  { id: "express", label: "Express.js", cluster: "backend" },
  { id: "nest", label: "NestJS", cluster: "backend" },
  { id: "socket", label: "Socket.IO", cluster: "backend" },
  { id: "mongo", label: "MongoDB", cluster: "databases" },
  { id: "sql", label: "SQL", cluster: "databases" },
  { id: "git", label: "Git", cluster: "tools" },
  { id: "github", label: "GitHub", cluster: "tools" },
  { id: "rest", label: "RESTful APIs", cluster: "tools" },
  { id: "jwt", label: "JWT Authentication", cluster: "tools" },
];

/** How these technologies relate to one another. Structural facts, not proficiency claims. */
export const skillLinks: readonly (readonly [string, string])[] = [
  ["js", "react"],
  ["js", "node"],
  ["ts", "next"],
  ["ts", "angular"],
  ["ts", "nest"],
  ["react", "next"],
  ["tailwind", "next"],
  ["node", "express"],
  ["node", "nest"],
  ["node", "socket"],
  ["express", "mongo"],
  ["nest", "mongo"],
  ["express", "rest"],
  ["nest", "jwt"],
  ["git", "github"],
  ["rest", "next"],
];
