import { ArrowUp, ArrowUpRight, Download, Mail } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Magnetic } from "@/components/ui/Magnetic";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Split } from "@/components/ui/Split";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { profile } from "@/data/profile";

import { CopyEmail } from "./CopyEmail";

const socialClass = "group border-line hover:border-line-strong flex min-h-14 items-center justify-between gap-6 border-b py-3 transition-colors";

export function Contact() {
  return (
    <section
      id="contact"
      data-pose="contact"
      aria-labelledby="contact-title"
      className="z-content relative flex min-h-svh flex-col justify-end px-(--gutter) pt-36 pb-8 lg:pt-24"
    >
      <SectionLabel index="10" title="Converging Network" className="mb-8" />
      <h2 id="contact-title" data-reveal="chars" className="display text-[clamp(2.65rem,min(9.4vw,13.5svh),10.5rem)]">
        <Split text={"Let's Build\nSomething\nExtraordinary."} />
      </h2>

      <div className="mt-10 grid gap-10 lg:mt-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p data-reveal="rise" className="body-lead max-w-[28rem]">
            Have an interesting project, opportunity, or idea? Let&apos;s turn it into something meaningful.
          </p>
          <p data-reveal="rise" className="text-mute mt-3 max-w-[28rem] leading-relaxed">
            Different technologies, experiences, and ideas come together to build something meaningful.
          </p>
          <div data-reveal="rise" className="mt-7 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.5}>
              <a href={`mailto:${profile.email}`} className="btn btn-primary min-h-16 px-8">
                Start a Conversation
                <Mail aria-hidden="true" size={16} />
              </a>
            </Magnetic>
          </div>
          <CopyEmail email={profile.email} />
        </div>

        <ul data-reveal="stagger" className="font-display lg:bg-ink-0/70 text-[1.05rem] tracking-[-0.01em] lg:col-span-5 lg:col-start-8 lg:px-5 lg:py-2 lg:backdrop-blur-sm">
          <li>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="LinkedIn profile (opens in a new tab)">
              <span className="flex items-center gap-3">
                <LinkedinIcon size={16} className="text-mute" /> LinkedIn
              </span>
              <ArrowUpRight aria-hidden="true" size={16} className="text-mute group-hover:text-paper transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </li>
          <li>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="GitHub profile (opens in a new tab)">
              <span className="flex items-center gap-3">
                <GithubIcon size={16} className="text-mute" /> GitHub
              </span>
              <ArrowUpRight aria-hidden="true" size={16} className="text-mute group-hover:text-paper transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </li>
          <li>
            <a href={profile.resume} download={profile.resumeFileName} className={socialClass} aria-label="Download resume as a PDF">
              <span className="flex items-center gap-3">
                <Download aria-hidden="true" size={16} className="text-mute" /> Resume
              </span>
              <span className="label text-[0.64rem]">PDF</span>
            </a>
          </li>
        </ul>
      </div>

      <footer className="label mt-8 flex items-center justify-between gap-6 text-[0.64rem] xl:pl-[22rem]">
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <Magnetic strength={0.3}>
          <TransitionLink href="#home" className="text-paper flex min-h-11 items-center gap-2">
            Back to Top <ArrowUp aria-hidden="true" size={14} />
          </TransitionLink>
        </Magnetic>
      </footer>
    </section>
  );
}
