export type ProjectId = "bloodlink" | "prolink" | "wanderlust";

export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: ProjectId;
  number: string;
  /** Which of the three compositions in the exhibition this project is staged in. */
  layout: "flagship" | "mirror" | "editorial";
  title: string;
  accent: string;
  description: string;
  stack: readonly string[];
  live: string;
  liveLabel: string;
  repo: string;
  features: readonly string[];
  achievements?: readonly string[];
  caseStudy?: string;
  /** What the 3D model acts out, in order. Each entry lights its part of the model. */
  flow: { title: string; steps: readonly string[] };
  /** Hovering a legend entry illuminates that group of nodes in the 3D model. */
  legend?: readonly { group: number; label: string }[];
  conceptNote: string;
  captures: readonly ProjectImage[];
  /** Screens from inside the app, shown on a panel of their own after the project. */
  gallery?: readonly (ProjectImage & { caption: string })[];
}

/** Links verified against the resume and the public GitHub profile. Captures are real screenshots of the live apps. */
export const projects: readonly Project[] = [
  {
    id: "bloodlink",
    layout: "flagship",
    number: "01",
    title: "BloodLink",
    accent: "var(--color-crimson)",
    description:
      "A full-stack platform connecting patients with medically screened blood donors and nearby blood banks.",
    stack: ["Next.js", "TypeScript", "NestJS", "MongoDB", "Socket.IO", "Tailwind CSS"],
    live: "https://bloodlink-sepia.vercel.app",
    liveLabel: "bloodlink-sepia.vercel.app",
    repo: "https://github.com/Nirupam-Pal/Blood_Link",
    features: [
      "JWT access and refresh tokens",
      "Role-based access control",
      "OTP email verification",
      "Real-time chat with Socket.IO",
      "Location-based donor search",
      "Medical eligibility screening",
      "Blood bank inventory dashboard",
      "In-app notifications",
    ],
    achievements: ["First Prize, Technovate Hackathon", "Presented at the Tripura Startup Policy launch"],
    caseStudy: "/work/bloodlink",
    legend: [
      { group: 0, label: "Donors" },
      { group: 1, label: "Patients" },
      { group: 2, label: "Blood banks" },
    ],
    flow: { title: "The request flow", steps: ["Search by location", "Send a request", "Donor accepts", "Chat opens"] },
    conceptNote: "3D form: a conceptual model, acting out the real request flow",
    captures: [
      {
        src: "/captures/bloodlink.webp",
        alt: "Landing page of the live BloodLink app, headlined Find a Blood Donor Without the Wait, with a phone showing nearby donors.",
        width: 1600,
        height: 1000,
      },
    ],
  },
  {
    id: "prolink",
    layout: "mirror",
    number: "02",
    title: "ProLink",
    accent: "var(--color-periwinkle)",
    description:
      "A full-stack professional networking platform where users publish posts, interact through likes and comments, and connect with other users.",
    stack: ["Next.js", "Express.js", "Node.js", "MongoDB"],
    live: "https://profile-link-zeta.vercel.app",
    liveLabel: "profile-link-zeta.vercel.app",
    repo: "https://github.com/Nirupam-Pal/proLink",
    features: ["Posts", "Likes and comments", "User connections"],
    flow: { title: "What users do", steps: ["Publish a post", "Likes and comments", "Connect with a user"] },
    conceptNote: "3D form: a conceptual model, acting out the real features",
    captures: [
      {
        src: "/captures/prolink.webp",
        alt: "Landing page of the live ProLink app, showing a profile card, a post with likes and comments, and a connection request.",
        width: 1600,
        height: 1000,
      },
    ],
    gallery: [
      {
        src: "/captures/prolink-feed.webp",
        caption: "The feed",
        alt: "The signed-in ProLink feed: a post between the navigation and a list of top profiles. The post and the other members are blurred for privacy.",
        width: 1600,
        height: 798,
      },
      {
        src: "/captures/prolink-discover.webp",
        caption: "Discover",
        alt: "ProLink's Discover page: a grid of member cards, each linking to a profile. Members' photos, names and handles are blurred for privacy.",
        width: 1600,
        height: 790,
      },
      {
        src: "/captures/prolink-connections.webp",
        caption: "My Connections",
        alt: "ProLink's My Connections page: an empty list of pending requests above a network of three connected members, whose details are blurred for privacy.",
        width: 1600,
        height: 783,
      },
      {
        src: "/captures/prolink-profile.webp",
        caption: "Profile",
        alt: "Nirupam Pal's ProLink profile, with a photo, an About section, recent activity and a button to add work history. Other members in the side list are blurred for privacy.",
        width: 1600,
        height: 807,
      },
    ],
  },
  {
    id: "wanderlust",
    layout: "editorial",
    number: "03",
    title: "Wanderlust",
    accent: "var(--color-dusk)",
    description:
      "A property listing and rental platform featuring listings, custom pricing, reviews, and secure authentication.",
    stack: ["EJS", "Express.js", "Node.js", "MongoDB", "Bootstrap"],
    live: "https://wander-lust-6kcl.onrender.com/listings",
    liveLabel: "wander-lust-6kcl.onrender.com",
    repo: "https://github.com/Nirupam-Pal/Wander-Lust",
    features: ["Property listings", "Custom pricing", "Reviews", "Secure authentication"],
    flow: { title: "Three real listings", steps: ["Lakeside house", "Timber cabin", "Villa and pool"] },
    conceptNote: "3D form: a conceptual model, built from these listing photos",
    captures: [
      {
        src: "/captures/wanderlust-lake.webp",
        alt: "Listing photo from the live Wanderlust app: a lakeside house at dusk beneath a dark forest.",
        width: 416,
        height: 320,
      },
      {
        src: "/captures/wanderlust-cabin.webp",
        alt: "Listing photo from the live Wanderlust app: a lit timber cabin in the snow.",
        width: 416,
        height: 320,
      },
      {
        src: "/captures/wanderlust-azure.webp",
        alt: "Listing photo from the live Wanderlust app: a modern villa with an infinity pool by the sea.",
        width: 416,
        height: 320,
      },
    ],
  },
];
