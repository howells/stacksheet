import type { SpringConfig } from "./types";

/**
 * Spring presets inspired by iOS animation feel.
 *
 * - `soft` — Very gentle, slow settle. Loaders, radial pickers.
 * - `subtle` — Barely noticeable bounce, professional.
 * - `natural` — Balanced, general-purpose default.
 * - `playful` — Character with bounce.
 * - `bouncy` — Visible bounce, energetic. Popovers, hints.
 * - `snappy` — Quick, responsive for interactions.
 * - `stiff` — Very quick, controlled. Panels, drawers. **(default)**
 */
export const springs = {
  soft: { stiffness: 120, damping: 18, mass: 1 },
  subtle: { stiffness: 300, damping: 30, mass: 1 },
  natural: { stiffness: 200, damping: 20, mass: 1 },
  playful: { stiffness: 170, damping: 15, mass: 1 },
  bouncy: { stiffness: 260, damping: 12, mass: 1 },
  snappy: { stiffness: 400, damping: 28, mass: 0.8 },
  stiff: { stiffness: 400, damping: 40, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

export type SpringPreset = keyof typeof springs;
