import type { SpringConfig } from "./types";

/**
 * Spring presets inspired by iOS animation feel.
 *
 * - `subtle` — Barely noticeable bounce, professional.
 * - `snappy` — Quick, responsive for interactions.
 * - `stiff` — Very quick, controlled. Panels, drawers. **(default)**
 */
export const springs = {
  subtle: { stiffness: 300, damping: 30, mass: 1 },
  snappy: { stiffness: 400, damping: 28, mass: 0.8 },
  stiff: { stiffness: 400, damping: 40, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

export type SpringPreset = keyof typeof springs;
