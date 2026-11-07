import { profile } from "@/data/profile";
import { projects } from "@/data/projects";

/** Explicit URL first, then the host's own, so metadata is correct without configuration. */
export const siteUrl = (() => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
})();

export const siteTitle = "Nirupam Pal | Full-Stack Developer";
export const siteDescription =
  "Portfolio of Nirupam Pal, a full-stack developer building scalable web applications, intuitive digital products and meaningful technology solutions.";

export function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: profile.name,
        jobTitle: profile.role,
        url: siteUrl,
        email: `mailto:${profile.email}`,
        sameAs: [profile.linkedin, profile.github],
        alumniOf: { "@type": "CollegeOrUniversity", name: "ICFAI University Tripura" },
        knowsAbout: ["JavaScript", "TypeScript", "React", "Next.js", "Angular", "Node.js", "NestJS", "MongoDB"],
      },
      ...projects.map((p) => ({
        "@type": "CreativeWork",
        name: p.title,
        description: p.description,
        url: p.live,
        creator: { "@id": `${siteUrl}/#person` },
        keywords: p.stack.join(", "),
      })),
    ],
  };
}

/** Serialises JSON-LD safely for inline use: "<" can never close the script tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
