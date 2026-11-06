import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { Choreography } from "@/components/layout/Choreography";
import { Cursor } from "@/components/layout/Cursor";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { SceneLoader } from "@/components/layout/SceneLoader";
import { ScrollRule } from "@/components/layout/ScrollRule";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { jsonLd, siteDescription, siteTitle, siteUrl, structuredData } from "@/lib/site";
import "@/styles/globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s | Nirupam Pal" },
  description: siteDescription,
  applicationName: "The Computational Universe",
  authors: [{ name: "Nirupam Pal", url: siteUrl }],
  creator: "Nirupam Pal",
  keywords: ["Nirupam Pal", "Full-Stack Developer", "Next.js", "NestJS", "TypeScript", "Portfolio", "Tripura"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nirupam Pal",
    title: siteTitle,
    description: siteDescription,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint, so scroll-revealed content is hidden only when scripts will reveal it.
const preHydration = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preHydration }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData()) }} />
      </head>
      <body>
        <a
          href="#content"
          className="bg-paper text-ink-0 z-transition fixed top-3 left-3 -translate-y-20 px-4 py-3 font-mono text-xs uppercase focus:translate-y-0"
        >
          Skip to content
        </a>

        <div aria-hidden="true" className="page-grid z-wash" />
        <div aria-hidden="true" id="wash-steel" className="wash wash-steel z-wash" />
        <div aria-hidden="true" id="wash-crimson" className="wash wash-crimson z-wash" />
        <div aria-hidden="true" id="wash-blue" className="wash wash-blue z-wash" />
        <div aria-hidden="true" id="wash-dusk" className="wash wash-dusk z-wash" />
        <div aria-hidden="true" id="wash-gold" className="wash wash-gold z-wash" />

        <SceneLoader />
        <Navigation />
        <ScrollRule />

        <main id="content" tabIndex={-1} className="outline-none">
          {children}
        </main>

        <Cursor />
        <PageTransition />
        <SmoothScroll />
        <Choreography />
      </body>
    </html>
  );
}
