"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";

export function CopyEmail({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2400);
  };

  return (
    <div data-reveal="rise" className="mt-5">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy email address ${email}`}
        className="group flex min-h-11 flex-wrap items-center gap-3 text-left"
      >
        <span className="text-link font-display text-[clamp(1.05rem,1.5vw,1.375rem)] tracking-[-0.015em] break-all">{email}</span>
        <span className="text-mute group-hover:text-paper relative flex items-center gap-1.5 font-mono text-[0.68rem] tracking-[0.1em] uppercase transition-colors">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5"
            >
              {status === "copied" ? <Check aria-hidden="true" size={13} className="text-sky" /> : <Copy aria-hidden="true" size={13} />}
              {status === "copied" ? "Copied" : status === "failed" ? "Press Ctrl+C" : "Copy"}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
      <span role="status" className="sr-only">
        {status === "copied" ? "Email address copied to clipboard" : status === "failed" ? "Could not copy the email address" : ""}
      </span>
    </div>
  );
}
