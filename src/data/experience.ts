export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  start: string;
  end: string;
  place: string;
  summary: string;
  details: readonly string[];
}

/** Chronological, exactly as listed on the resume. */
export const experience: readonly Experience[] = [
  {
    id: "prejest",
    company: "Prejest-HR",
    role: "Software Developer Intern",
    period: "June 2025 – August 2025",
    start: "06.25",
    end: "08.25",
    place: "Agartala, Tripura",
    summary: "Designed and implemented a Leave and Attendance module for a web-based Angular SaaS application.",
    details: ["Streamlined HR workflows and reduced manual processing time."],
  },
  {
    id: "thoughtflow",
    company: "Thought-Flow Media",
    role: "Manager",
    period: "August 2025 – Present",
    start: "08.25",
    end: "Now",
    place: "Agartala, Tripura",
    summary: "Oversee end-to-end marketing projects and coordinate the creative teams behind them.",
    details: [
      "Assign tasks to video editors, videographers and graphic designers.",
      "Schedule meetings and ensure timely, high-quality deliverables for clients.",
    ],
  },
];
