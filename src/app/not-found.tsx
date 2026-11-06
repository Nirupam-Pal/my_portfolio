import type { Metadata } from "next";

import { TransitionLink } from "@/components/ui/TransitionLink";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section data-pose="education" className="z-content relative flex min-h-svh flex-col justify-center px-(--gutter)">
      <p className="label mb-6">Sheet not found / 404</p>
      <h1 className="display text-[clamp(3.5rem,12vw,12rem)]">
        Nothing is
        <br />
        built here.
      </h1>
      <div className="mt-10">
        <TransitionLink href="/" className="btn btn-primary">
          Back to the Start
        </TransitionLink>
      </div>
    </section>
  );
}
