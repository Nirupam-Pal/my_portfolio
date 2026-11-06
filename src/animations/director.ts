import { isPoseId, type PoseId } from "@/scenes/poses";
import { sceneStore } from "@/scenes/store";

export interface Anchor {
  pose: PoseId;
  from: number;
  to: number;
}

type AnchorProvider = () => Anchor[];

const providers = new Set<AnchorProvider>();
let anchors: Anchor[] = [];

/** Sections that move sideways report their own scroll positions, since DOM offsets do not apply. */
export function registerAnchorProvider(provider: AnchorProvider) {
  providers.add(provider);
  return () => {
    providers.delete(provider);
  };
}

/**
 * Turns the page into a table of "hold this pose between these scroll positions".
 * A section at least as tall as the viewport holds for as long as it fills the screen;
 * the transition occupies exactly the scroll distance in which two sections share it.
 */
export function rebuildAnchors() {
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  const list: Anchor[] = [];

  document.querySelectorAll<HTMLElement>("[data-pose]").forEach((el) => {
    if (el.closest("[data-pose-external]")) return;
    const pose = el.dataset.pose;
    if (!isPoseId(pose)) return;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return;
    const top = rect.top + scrollY;
    if (rect.height >= vh) {
      list.push({ pose, from: top, to: top + rect.height - vh });
    } else {
      const center = top + rect.height / 2 - vh / 2;
      list.push({ pose, from: center, to: center });
    }
  });

  providers.forEach((p) => list.push(...p()));
  list.sort((a, b) => a.from - b.from);

  for (let i = 1; i < list.length; i++) {
    if (list[i].from < list[i - 1].to) list[i].from = list[i - 1].to;
    if (list[i].to < list[i].from) list[i].to = list[i].from;
  }
  anchors = list;
  updateDirector(scrollY);
}

export function updateDirector(scroll: number) {
  if (anchors.length === 0) return;

  let poseA = anchors[0].pose;
  let poseB = anchors[0].pose;
  let mix = 0;

  const last = anchors[anchors.length - 1];
  if (scroll >= last.from) {
    poseA = poseB = last.pose;
  } else {
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const next = anchors[i + 1];
      if (scroll < a.from) break;
      if (!next) break;
      if (scroll <= a.to) {
        poseA = poseB = a.pose;
        mix = 0;
        break;
      }
      if (scroll < next.from) {
        poseA = a.pose;
        poseB = next.pose;
        const t = (scroll - a.to) / Math.max(1, next.from - a.to);
        mix = t * t * (3 - 2 * t);
        break;
      }
    }
  }

  const changed = poseA !== sceneStore.poseA || poseB !== sceneStore.poseB || Math.abs(mix - sceneStore.mix) > 1e-3;
  sceneStore.poseA = poseA;
  sceneStore.poseB = poseB;
  sceneStore.mix = mix;
  if (changed) sceneStore.invalidate?.();
}
