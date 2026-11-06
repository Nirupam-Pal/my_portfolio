/** A direction of study, stated as one. Nothing here claims a finished course, a project or a result. */
export const aiCopy = {
  eyebrow: "Currently exploring / AI & Machine Learning",
  title: "Beyond\nThe Algorithm.",
  body: "I'm expanding my software engineering foundation into Artificial Intelligence and Machine Learning, exploring how data, algorithms, and intelligent systems can solve meaningful problems.",
} as const;

export const aiLayers = [
  { label: "Input", nodes: 4 },
  { label: "Hidden", nodes: 6 },
  { label: "Hidden", nodes: 6 },
  { label: "Output", nodes: 3 },
] as const;

/** Areas of exploration, in no claimed order of completion. */
export const aiRoadmap = [
  "Python for AI/ML",
  "Mathematical foundations",
  "Data preprocessing and analysis",
  "Machine learning fundamentals",
  "Neural networks and deep learning",
  "Practical AI applications",
] as const;
