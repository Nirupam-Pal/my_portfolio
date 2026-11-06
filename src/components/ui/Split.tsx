import { Fragment, type CSSProperties } from "react";

/** Letters split into inline-blocks lose the font's kerning, so the heaviest pairs are restored by hand. */
const KERN: Record<string, number> = {
  PA: -0.07, AT: -0.055, TA: -0.055, AV: -0.06, VA: -0.06, AY: -0.05, LT: -0.075, LY: -0.07,
  "L.": -0.075, "Y.": -0.08, "T.": -0.07, TO: -0.02, RY: -0.03, "K.": -0.02, RT: -0.02, FT: -0.02,
};

interface SplitProps {
  /** Use a newline to force a line break. */
  text: string;
  by?: "chars" | "words";
  /** Marks letters for the CSS entrance used above the fold, instead of a scroll reveal. */
  hero?: boolean;
  /** Starting index, when several Split elements stagger as one. */
  offset?: number;
}

/** Server-rendered split text. Screen readers get the sentence; sighted users get the masked lines. */
export function Split({ text, by = "chars", hero = false, offset = 0 }: SplitProps) {
  let index = offset;
  return (
    <>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true">
        {text.split("\n").map((line, l) => (
          <span key={l} className="split-line">
            {line.split(" ").map((word, w, words) => (
              <Fragment key={w}>
                {by === "words" ? (
                  <span className="split-word">{word}</span>
                ) : (
                  <span className="split-group">
                    {Array.from(word).map((char, c, chars) => {
                      const kern = KERN[char + (chars[c + 1] ?? "")];
                      const i = index++;
                      return (
                        <span
                          key={c}
                          className={hero ? "hero-char" : "split-char"}
                          style={
                            {
                              "--i": i,
                              marginRight: kern ? `${kern}em` : undefined,
                            } as CSSProperties
                          }
                        >
                          {char}
                        </span>
                      );
                    })}
                  </span>
                )}
                {w < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </>
  );
}
