# The Computational Universe

An interactive journey through software, systems, data and intelligence: the portfolio of Nirupam Pal. One WebGL scene stays on screen for the whole page and rebuilds itself into a different system for each chapter.

## The idea

Every object is a system and every connection is information. A single pool of machined modules, light paths, translucent surfaces and nodes changes form as you scroll:

| Section | Form |
| --- | --- |
| Hero | A laptop with code on its screen, and the full-stack application it is building around it: interface, services, database, API paths and a small AI/ML cluster |
| About | The same application pulled apart into Frontend, APIs & Authentication, Backend and Database, with Problem Solving & System Design as a decision tree beside it |
| BloodLink | A real-time network acting out the request flow: search by location, send a request, donor accepts, chat opens |
| ProLink | A social graph acting out the features: publish a post, likes and comments, connect with a user |
| Wanderlust | Three houses built from the three listing photos, each lighting with its picture |
| Experience | A branching commit graph that draws itself as the timeline is read. A way of picturing a career, not a real repository |
| Freelance | The laptop again, with a window for each of the four client sites. Hovering a card lights its window |
| Testimonials | The same network, far back and quiet behind the quotes |
| Skills | A graph of six clusters. Hovering a technology lights it, what it connects to and its category |
| AI & ML | The Neural Intelligence Lab: input, hidden and output layers that assemble, connect and carry signals. Presented as areas of exploration |
| Achievements | BloodLink's network twice: inside an award ring for the prize, broadcasting outward for the presentation |
| Education | A knowledge graph from 2021 to 2026 |
| Contact | Technologies, experiences and ideas converging on the laptop from the hero |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Three.js, React Three Fiber, drei, GSAP with ScrollTrigger, Lenis, Motion and Lucide.

TypeScript stays on 6.0 because `typescript-eslint` does not support 7 yet.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Deploying to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository. The defaults for Next.js are correct.
3. Deploy. Metadata uses `VERCEL_PROJECT_PRODUCTION_URL` automatically.
4. If you add a custom domain, set `NEXT_PUBLIC_SITE_URL` to it (see `.env.example`) and redeploy.

Or from the terminal:

```bash
npx vercel --prod
```

## Architecture

```
src/
  app/          Routes, metadata, sitemap, robots, Open Graph image
  components/
    layout/     Navigation, cursor, Lenis, page transition, scene loader, reveal choreography
    sections/   One file per section. Server Components, plus small client islands
    ui/         Split text, magnetic wrapper, buttons, links
  scenes/       All 3D: geometry (forms), poses (camera and light), engine (render loop)
  animations/   GSAP setup, scroll helpers, the scroll-to-pose director
  data/         Everything personal or factual. Edit content here
  lib/          Site URL and structured data
  styles/       Design tokens and global CSS
public/
  captures/     Real screenshots of the live apps
```

### How the scroll drives the 3D

1. Any element with `data-pose="..."` says "show this pose while I fill the screen".
2. `animations/director.ts` turns those into a table of scroll positions, rebuilt on every ScrollTrigger refresh so pin spacing is always included. The horizontal exhibition reports its own positions.
3. On each GSAP tick the director writes the current pair of poses and a mix value to `scenes/store.ts`, a plain object outside React, so animation never causes a re-render.
4. `scenes/engine.ts` reads the store each frame, interpolates all instances and writes their matrices directly.

To add a pose, add it to `POSES` in `scenes/poses.ts` and put `data-pose` on an element. To add a form, write a generator in `scenes/geometry.ts` using `FormBuilder`.

### How the 3D carries real content

`scenes/layouts.ts` says where the content sits in each form, with the text coming from `data/`. `data/stack.ts` lists the layers of the application and their technologies, and `data/ai.ts` holds the AI & ML copy, network layers and roadmap.

- **Tags** mark which modules, light paths, panels and nodes belong together. `litTagsFor` says what a step lights up.
- **Sequences** (`sequence` on a pose) step through what a form acts out. Hovering, focusing or tapping a step holds it, and `PauseModels` stops them all. With reduced motion they never run on their own.
- **`StepHost`** connects page content to a sequence: its `[data-step-item]` children get `data-active`.
- **Labels** (`LABEL_SETS`, plus `HeroModel`) are DOM elements the render loop keeps over points in the model.

### Animating content

Sections declare intent with attributes, and `Choreography.tsx` applies them:

- `data-reveal="chars | words | rise | clip | rule | perspective | stagger"`
- `data-parallax="10"` and `data-drift="8"`

Content is hidden before hydration only when scripts are running, with a CSS failsafe, so it is never lost.

### Keeping it fast

- **One animation loop.** Lenis, the scroll director and the canvas all run from `gsap.ticker`, so DOM and 3D agree on every frame.
- **Forms are built in a worker.** `scenes/loadForms.ts` runs `scenes/forms.worker.ts` off the main thread and receives the arrays by transfer.
- **Titanium is a small custom shader.** `STEEL_FRAG` in `scenes/engine.ts` reflects an analytic set of strip lights, so there is no environment map to prefilter and no PBR shader to compile at start-up.
- **Reveals use one IntersectionObserver** (`animations/reveal.ts`), and section tracking uses observers too. ScrollTrigger is kept for what is scrubbed or pinned.
- **Hydration is split.** Each section in `app/page.tsx` has its own `Suspense` boundary, so React can yield between them.
- **Motion loads on demand.** It is only used by `MobileMenu.tsx`, which is fetched the first time the menu opens.
- **Phones do less.** The scene loads later, the forms hold still, and instance data is only rewritten while something is changing. A change of light alone does not rewrite the modules.

## Accessibility and fallbacks

- All content is real HTML and remains readable without WebGL. With no WebGL, or with Data Saver on, the canvas is skipped, the hero and AI & ML sections show static drawings and the skills become expandable lists.
- `prefers-reduced-motion`: no Lenis, pinning, reveals, cursor or ambient motion. The 3D holds still and only changes between sections.
- The custom cursor appears only with a fine pointer that can hover.
- Skill labels are positioned over the 3D nodes, and the same list is available to screen readers as text.

## Updating content

- Details, expertise, achievements, education: `src/data/profile.ts`
- Projects: `src/data/projects.ts`
- Freelance projects: `src/data/freelance.ts`
- Testimonials (placeholders for now, replace before going live): `src/data/testimonials.ts`
- Work history: `src/data/experience.ts`
- Skills and how they connect: `src/data/skills.ts`
- AI & ML copy and roadmap: `src/data/ai.ts`
- Layers of the stack: `src/data/stack.ts`
- Resume: replace `public/Nirupam-Pal-Resume.pdf`
