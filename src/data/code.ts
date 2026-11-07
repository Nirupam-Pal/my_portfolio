export type CodeTone = "plain" | "keyword" | "string" | "name" | "call";

/** What the laptop in the hero shows. Every value in it is a fact from the resume. */
export const codeFile = "developer.ts";

export const codeLines: readonly (readonly (readonly [string, CodeTone])[])[] = [
  [["const ", "keyword"], ["developer", "name"], [" = {", "plain"]],
  [["  name: ", "plain"], ['"Nirupam Pal"', "string"], [",", "plain"]],
  [["  role: ", "plain"], ['"Full-Stack Developer"', "string"], [",", "plain"]],
  [["  stack: [", "plain"], ['"Next.js"', "string"], [", ", "plain"], ['"NestJS"', "string"], [", ", "plain"], ['"MongoDB"', "string"], ["],", "plain"]],
  [["  exploring: ", "plain"], ['"AI & ML"', "string"], [",", "plain"]],
  [["};", "plain"]],
  [],
  [["build", "call"], ["(", "plain"], ["developer", "name"], [").", "plain"], ["ship", "call"], ["();", "plain"]],
];
