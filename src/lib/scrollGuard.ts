/**
 * Lets a section limit how far one wheel/trackpad step may move Lenis's scroll
 * target. App's Lenis `virtualScroll` runs every step through the guard.
 * StoryScroll uses it so a fast flick can't skip past the pinned story while
 * it is still playing. Native jumps (nav links, keyboard) are not affected.
 */
type Guard = (deltaY: number, fromScroll: number) => number

let guard: Guard | null = null

export function setScrollGuard(next: Guard | null) {
  guard = next
}

/** Returns the delta to apply: unchanged, shortened, or 0 to drop the step. */
export function applyScrollGuard(deltaY: number, fromScroll: number) {
  return guard ? guard(deltaY, fromScroll) : deltaY
}
