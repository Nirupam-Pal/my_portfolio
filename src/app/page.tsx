import { Suspense, type ReactNode } from "react";

import { RevealScope } from "@/components/layout/RevealScope";
import { ModelLabels } from "@/components/sections/ModelLabels";
import { About } from "@/components/sections/About";
import { Achievements } from "@/components/sections/Achievements";
import { ArtificialIntelligence } from "@/components/sections/ArtificialIntelligence";
import { Contact } from "@/components/sections/Contact";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Freelance } from "@/components/sections/Freelance";
import { Hero } from "@/components/sections/Hero";
import { Skills } from "@/components/sections/Skills";
import { Testimonials } from "@/components/sections/Testimonials";
import { Work } from "@/components/sections/Work";

/** The boundary lets React hydrate each section in its own task instead of one long one. */
function Deferred({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <RevealScope>{children}</RevealScope>
    </Suspense>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ModelLabels />
      <Deferred>
        <About />
      </Deferred>
      <Deferred>
        <Work />
      </Deferred>
      <Deferred>
        <Freelance />
      </Deferred>
      <Deferred>
        <Testimonials />
      </Deferred>
      <Deferred>
        <Experience />
      </Deferred>
      <Deferred>
        <Skills />
      </Deferred>
      <Deferred>
        <ArtificialIntelligence />
      </Deferred>
      <Deferred>
        <Achievements />
      </Deferred>
      <Deferred>
        <Education />
      </Deferred>
      <Deferred>
        <Contact />
      </Deferred>
    </>
  );
}
