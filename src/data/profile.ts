/** Single source of truth for personal details. Everything here comes from the resume. */
export const profile = {
  name: "Nirupam Pal",
  role: "Full-Stack Developer",
  email: "nirupampal14@gmail.com",
  resume: "/Nirupam-Pal-Resume.pdf",
  resumeFileName: "Nirupam-Pal-Resume.pdf",
  linkedin: "https://www.linkedin.com/in/nirupam-pal-22b959250/",
  github: "https://github.com/Nirupam-Pal",
  location: "Agartala, Tripura",
  statement: "I build scalable web applications, intuitive digital products, and meaningful technology solutions.",
} as const;

export const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "freelance", label: "Freelance" },
  { id: "testimonials", label: "Testimonials" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "ai", label: "AI & ML" },
  { id: "contact", label: "Contact" },
] as const;

export type NavId = (typeof navItems)[number]["id"];

export const expertise = [
  {
    id: "engineering",
    title: "Engineering",
    body: "I work across the whole stack: Next.js and Angular on the front, NestJS and Express behind them, MongoDB and SQL underneath, with JWT authentication and role-based access holding it together.",
  },
  {
    id: "creativity",
    title: "Creativity",
    body: "At Thought-Flow Media I coordinate video editors, videographers and graphic designers. Working next to creative teams every day shapes how I think about what a product should feel like.",
  },
  {
    id: "problem-solving",
    title: "Problem Solving",
    body: "BloodLink began as a practical question: how do patients reach medically screened donors and nearby blood banks? I conceived and built the answer, and it took first prize at Technovate.",
  },
  {
    id: "leadership",
    title: "Leadership",
    body: "I run marketing projects end to end, assigning tasks, scheduling meetings and keeping client deliverables on time. As University Representative, I presented BloodLink at the Tripura Startup Policy launch.",
  },
] as const;

export const achievements = [
  {
    id: "technovate",
    kicker: "First Prize Winner",
    title: "Technovate\nHackathon",
    body: "Awarded for BloodLink, a blood donation platform I conceived and built, at ICFAI University.",
  },
  {
    id: "policy",
    kicker: "University Representative",
    title: "Tripura Startup\nPolicy Launch",
    body: "Presented BloodLink before the Hon'ble Chief Minister and government officials.",
  },
] as const;

export const education = [
  {
    year: "2026",
    school: "ICFAI University Tripura",
    award: "Bachelor of Technology in Computer Science",
    detail: "GPA 8.5 / 10",
    place: "Kamalghat, Tripura",
  },
  {
    year: "2021",
    school: "Shishu Bihar Higher Secondary School",
    award: "Science Stream, TBSE",
    detail: "Class 12: 83%",
    place: "Agartala, Tripura",
  },
] as const;
