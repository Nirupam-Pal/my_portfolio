import { projects, type ProjectId, type ProjectImage } from "./projects";

export interface CaseStudyScreen extends ProjectImage {
  title: string;
  body: string;
}

export interface CaseStudy {
  hero: ProjectImage & { caption: string };
  overview: { heading: string; paragraphs: readonly string[] };
  flow: { heading: string; steps: readonly string[] };
  screens: { heading: string; note?: string; items: readonly CaseStudyScreen[] };
  systems: readonly { title: string; body: string }[];
  /** Everything in the project's repository, beyond the headline stack on its panel. */
  stack: readonly string[];
}

const [bloodlink, prolink] = projects;
const [feed, discover, connections, profile] = prolink.gallery!;

/** Every statement here comes from the resume, the live app or the project's public repository. */
export const caseStudies: Record<ProjectId, CaseStudy> = {
  bloodlink: {
    hero: { ...bloodlink.captures[0], caption: `Live capture: ${bloodlink.liveLabel}` },
    overview: {
      heading: "Finding blood still\ndepends on social media.",
      paragraphs: [
        "When a patient urgently needs blood, most families post a request on WhatsApp statuses and Facebook stories, then wait for someone with the right blood group to notice it. A post only reaches the people who happen to see it, and it says nothing about whether they are nearby or fit to donate.",
        "BloodLink replaces that wait with a searchable list of screened donors. A patient's family narrows the search down to the area around the hospital, sends a donor a request, and moves to a private chat the moment the donor accepts. Blood banks register too, and keep their stock visible to the people searching.",
      ],
    },
    flow: {
      heading: "From search\nto conversation.",
      steps: bloodlink.flow.steps,
    },
    screens: {
      heading: "On the\nlive site.",
      note: "Names on the feature cards are the site's own sample content.",
      items: [
        {
          src: "/captures/bloodlink-features.webp",
          alt: "BloodLink's Features Built for Emergencies section: cards for donor search, eligibility screening, private chat, connection requests, notifications and a blood bank's stock by group.",
          width: 1234,
          height: 1380,
          title: "Built around an emergency",
          body: "Each card on the landing page is one part of the product: search by blood group and place, screening, requests that show as pending, accepted or declined, chat, notifications, and each blood bank's stock for all eight blood groups.",
        },
        {
          src: "/captures/bloodlink-steps.webp",
          alt: "BloodLink's six steps: create an account, pass the eligibility check, search donors nearby, send a connection request, get notified and respond, chat and coordinate.",
          width: 680,
          height: 1016,
          title: "Six steps, three kinds of user",
          body: "The journey is split by who does what. Everyone verifies an email with a one-time password. Donors pass the eligibility check and answer requests. Patients and families search and send them. Both sides then meet in chat to arrange the time and place.",
        },
        {
          src: "/captures/bloodlink-register.webp",
          alt: "BloodLink's sign-up page asking how you will use the app, with a choice between Individual Donor or Patient, and Blood Bank Organization.",
          width: 1008,
          height: 666,
          title: "Two ways in",
          body: "Sign-up starts with one question, because the two accounts do different jobs. An individual searches for donors, sends requests and can become a verified donor. A blood bank gets a licence-verified listing and a console for its live inventory.",
        },
        {
          src: "/captures/bloodlink-bank.webp",
          alt: "BloodLink's blood bank registration form, asking for facility information, a licence number, an emergency phone number and a full address from state down to city.",
          width: 849,
          height: 968,
          title: "Blood banks on the same map",
          body: "A blood bank registers with a licence or accreditation number and an emergency phone number. Its address uses the same state, district, sub-division and city fields as donor search, so both can be found the same way.",
        },
      ],
    },
    systems: [
      {
        title: "Access",
        body: "A NestJS REST API secured with JWT access and refresh tokens, role-based access control across User and Blood Bank roles, and OTP email verification through the Brevo API.",
      },
      {
        title: "Discovery",
        body: "Location-based donor search that narrows the way real geography does: state, then district, then sub-division, then city.",
      },
      {
        title: "Trust",
        body: "Registering as a donor runs a medical eligibility check: age 18 to 65, at least 45 kg, and no current medication, recent tattoo or surgery, hepatitis, HIV, diabetes, high blood pressure or chronic disease. It returns the reasons as well as the result.",
      },
      {
        title: "Connection",
        body: "Accepting a request is one database transaction: it marks the request accepted, records the connection and opens the conversation, so two conflicting responses can't both succeed. Socket.IO then carries the chat, with its JWT checked as the socket connects, and in-app notifications tell each side what happened.",
      },
      {
        title: "Supply",
        body: "A live inventory dashboard for blood banks, with stock listed by blood group.",
      },
    ],
    stack: [...bloodlink.stack, "TanStack Query", "Zustand", "Brevo", "Swagger"],
  },

  prolink: {
    hero: { ...prolink.captures[0], caption: `Live capture: ${prolink.liveLabel}` },
    overview: {
      heading: "A professional network,\nend to end.",
      paragraphs: [
        "ProLink is a full-stack professional networking app. Members build a profile with their work history and education, publish posts with an attachment, like and comment on what others share, and send each other connection requests.",
        "It is built as two separate apps. A Next.js frontend keeps its sign-in and post state in Redux Toolkit, and talks over Axios to an Express API backed by MongoDB, with Cloudinary holding uploaded media.",
      ],
    },
    flow: {
      heading: "From a profile\nto a connection.",
      steps: ["Build a profile", "Publish a post", "Likes and comments", "Send a request", "Connected"],
    },
    screens: {
      heading: "Inside\nthe app.",
      note: "Other members' details are blurred for privacy.",
      items: [
        {
          ...feed,
          title: "The feed",
          body: "Signing in lands on the feed: your identity and navigation on the left, posts in the middle, and a list of top profiles on the right. A post carries its author, its text and any attached media.",
        },
        {
          ...discover,
          title: "Discover",
          body: "Discover lists everyone on the platform as a card with a photo, name and handle. Each card links to that member's profile page, addressed by username, where a connection request starts.",
        },
        {
          ...connections,
          title: "My Connections",
          body: "One page handles both sides of a connection: requests waiting on you sit above the people you're already connected with, and accepting a request moves that person into your network.",
        },
        {
          ...profile,
          title: "Your profile",
          body: "A profile brings together a photo, an About section, recent activity, work history and education, all editable in place. Any profile can also be downloaded as a generated PDF resume.",
        },
      ],
    },
    systems: [
      {
        title: "Accounts",
        body: "Passwords are hashed with bcrypt. Logging in issues a random 32-byte token stored against the user, and each protected request finds its user by that token, which is indexed because every one of them does this lookup.",
      },
      {
        title: "Posts",
        body: "Uploads go through Multer straight to Cloudinary, with images, video, PDFs and Word documents allowed. Only a post's author can delete it, and deleting it removes the file from Cloudinary too.",
      },
      {
        title: "Likes",
        body: "A post stores one entry per member who liked it, and the count is derived from that list instead of being saved separately, so the two can never disagree and nobody can like a post twice.",
      },
      {
        title: "Connections",
        body: "A request links two users and holds one of three states: waiting, accepted or declined. Both sides of it are indexed, so either person's list of requests stays a direct lookup.",
      },
      {
        title: "Resume PDF",
        body: "The API turns a profile into a PDF with PDFKit, including the member's photo, their bio and their past work.",
      },
    ],
    stack: [...prolink.stack, "Redux Toolkit", "Axios", "Mongoose", "bcrypt", "Multer", "Cloudinary", "PDFKit"],
  },

  wanderlust: {
    hero: {
      src: "/captures/wanderlust-index.webp",
      alt: "The Wanderlust listings page when signed in, showing category icons, a tax switch and listing cards with photos, titles and nightly prices in rupees.",
      width: 1600,
      height: 730,
      caption: "Signed in: wander-lust-6kcl.onrender.com",
    },
    overview: {
      heading: "List a place,\nset the price.",
      paragraphs: [
        "Wanderlust is a property listing and rental platform, inspired by the core of apps like Airbnb. Anyone can browse places to stay. With an account, you can publish your own listing with a photo and a nightly price, manage it afterwards, and leave ratings and reviews on listings.",
        "It is a server-rendered Node.js app organised as MVC: Express routes hand off to controllers, Mongoose models hold listings, reviews and users in MongoDB, and EJS templates with Bootstrap render every page.",
      ],
    },
    flow: {
      heading: "From sign-up\nto a review.",
      steps: ["Create an account", "Publish a listing", "Set a nightly price", "Guests browse", "Reviews come in"],
    },
    screens: {
      heading: "On the\nlive site.",
      note: "The listing owner's name is blurred for privacy.",
      items: [
        {
          src: "/captures/wanderlust.webp",
          alt: "The Wanderlust listings page when signed out, with a grid of five properties, each showing a photo, a title and a nightly price in rupees.",
          width: 1600,
          height: 1000,
          title: "Browse every listing",
          body: "The listings page needs no account. Each card shows a photo, a title and the price per night the owner chose, in rupees. Above the grid, a row of category icons scrolls sideways, and a switch adds an 18% GST note beside each price.",
        },
        {
          src: "/captures/wanderlust-detail.webp",
          alt: "A Wanderlust listing page for a poolside villa, with its photo, owner, description, price, location and country, above a form for leaving a review. The owner's name is blurred.",
          width: 1600,
          height: 731,
          title: "One listing, in full",
          body: "A listing's own page shows its photo, owner, description, price, location and country, with reviews below. Signed-in visitors get a form with a star rating and a comment, and only the owner sees the Edit and Delete buttons.",
        },
      ],
    },
    systems: [
      {
        title: "Accounts",
        body: "Passport.js with a local strategy handles sign-up and login. Sessions live in MongoDB through connect-mongo for seven days, in an HTTP-only cookie. If you're sent to log in partway through something, you return to the page you were trying to reach.",
      },
      {
        title: "Ownership",
        body: "Hiding a button isn't protection, so the routes check as well. Middleware confirms you are logged in, that you own a listing before you can edit or delete it, and that you wrote a review before you can remove it.",
      },
      {
        title: "Validation",
        body: "Joi schemas check every listing and review on the server before a controller runs: required fields, a price of at least zero, a rating from 1 to 5. A shared async wrapper and error class send failures to a single error page.",
      },
      {
        title: "Images",
        body: "Listing photos upload through Multer to Cloudinary, restricted to PNG and JPEG. The edit form asks Cloudinary for a resized preview by changing the image's URL.",
      },
      {
        title: "Reviews",
        body: "Each review keeps a rating, a comment and its author, and belongs to a listing. A Mongoose hook deletes a listing's reviews along with it, so no orphans are left behind.",
      },
    ],
    stack: [...projects[2].stack, "Mongoose", "Passport.js", "Joi", "Multer", "Cloudinary"],
  },
};
