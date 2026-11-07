/**
 * Sizes the hero name to the room actually left between its top and the first line of the copy beneath it.
 *
 * It runs twice: once as an inline script straight after the hero's markup, before the first paint, so the name
 * never appears at an estimate and then shrinks; and again from HeroFit whenever the copy, the screen or the fonts
 * change. It is serialised with `toString()` for the inline copy, so it must stay self-contained: no imports and
 * no variables from outside its own body.
 */
export function fitHeroName(): boolean {
  // Space kept between the last line of the name and the first line of the copy.
  const gap = 24;
  const name = document.querySelector<HTMLElement>(".hero-name");
  const holder = document.querySelector<HTMLElement>("[data-hero-name]");
  const copy = document.querySelector<HTMLElement>("[data-hero-copy]");
  const first = copy && (copy.firstElementChild as HTMLElement | null);
  const layer = copy && copy.parentElement;
  if (!name || !holder || !copy || !first || !layer) return false;
  const size = parseFloat(getComputedStyle(name).fontSize);
  if (!size || !name.offsetHeight) return false;
  // How tall the name is for each pixel of type, whatever its line height and masks add.
  const ratio = name.offsetHeight / size;
  const copyTop = layer.clientHeight - copy.offsetHeight + first.offsetTop;
  const room = copyTop - gap - holder.offsetTop;
  name.style.setProperty("--hero-fit", `${Math.max(room / ratio, 40)}px`);
  return true;
}
